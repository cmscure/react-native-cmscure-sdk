import { 
  NativeModules, 
  NativeEventEmitter, 
  Platform,
  Image, View, ActivityIndicator
} from 'react-native';
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  useMemo
} from 'react';
console.log("RN NativeModules:", NativeModules);
const { CMSCureSDK } = NativeModules;

if (!CMSCureSDK) {
  throw new Error(
    'CMSCureSDK native module is not available. ' +
    'Please check your installation and rebuild your app.'
  );
}

const eventEmitter = new NativeEventEmitter(CMSCureSDK);

// Context for providing SDK data throughout the app
const CMSCureContext = createContext(null);

// Main SDK object for direct API calls
export const Cure = {
  configure: async (config) => {
    const { projectId, apiKey, projectSecret } = config;
    if (Platform.OS === 'ios') {
      return CMSCureSDK.configure(projectId, apiKey, projectSecret);
    }
    return CMSCureSDK.configure(projectId, apiKey);
  },
  
  setLanguage: (languageCode) => CMSCureSDK.setLanguage(languageCode),
  getLanguage: () => CMSCureSDK.getLanguage(),
  availableLanguages: () => CMSCureSDK.availableLanguages(),
  translation: (key, tab) => CMSCureSDK.translation(key, tab),
  colorValue: (key) => CMSCureSDK.colorValue(key),
  imageURL: (key) => CMSCureSDK.imageURL(key),
  getStoreItems: (apiIdentifier) => CMSCureSDK.getStoreItems(apiIdentifier),
  syncStore: (apiIdentifier) => CMSCureSDK.syncStore(apiIdentifier),
  sync: (screenName) => CMSCureSDK.sync(screenName),
};

// Provider component
export const CMSCureProvider = ({ children, config }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const dataStoresRef = useRef({});
  const updateCounterRef = useRef(0);
  const forceUpdate = useState({})[1]; // A function to force re-render

  useEffect(() => {
    let isMounted = true;
    
    const initializeSDK = async () => {
      // Ensure config is provided before trying to initialize
      if (config && isMounted) {
        try {
          console.log('CMSCureProvider: Initializing SDK...');
          await Cure.configure(config);
          
          // Perform initial critical syncs
          await Promise.all([
            Cure.sync('__colors__'),
            Cure.sync('__images__'),
            Cure.sync('common_config') // Example critical tab
          ]);
          
          if (isMounted) {
            console.log('CMSCureProvider: SDK Initialized successfully.');
            setIsInitialized(true); // <-- This unlocks the rest of the app
          }
        } catch (error) {
          console.error('CMSCureProvider: Failed to initialize CMSCure SDK:', error);
          // You could handle this error state, maybe show a permanent error screen
        }
      }
    };

    initializeSDK();

    const subscription = eventEmitter.addListener('CMSCureContentUpdate', (event) => {
      if (!isMounted) return;
      console.log('CMSCureProvider: Content update received:', event);
      // Store the identifier of the content that was updated
      updateCounterRef.current = { id: event.identifier, time: Date.now() };
      forceUpdate(c => !c);
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [config]); // This effect runs only when the config object changes

  const contextValue = useMemo(() => ({
    isInitialized,
    dataStores: dataStoresRef.current,
    updateCounter: updateCounterRef.current
  }), [isInitialized, updateCounterRef.current]);

  // --- THE GATEKEEPER LOGIC ---
  if (!isInitialized) {
    // While the SDK is configuring, show a loading screen.
    // This prevents the rest of the app from running too early.
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Once initialized, render the actual app
  return (
    <CMSCureContext.Provider value={contextValue}>
      {children}
    </CMSCureContext.Provider>
  );
};

// Hook to ensure context is available
const useCMSCureContext = () => {
  const context = useContext(CMSCureContext);
  if (!context) {
    throw new Error('useCMSCure hooks must be used within CMSCureProvider');
  }
  return context;
}; 

// Hook for translations
export const useCureString = (key, tab, defaultValue = '') => {
  const { updateCounter } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let mounted = true;
    
    Cure.translation(key, tab).then(result => {
      if (mounted) {
        setValue(result || defaultValue);
      }
    }).catch(() => {
      if (mounted) {
        setValue(defaultValue);
      }
    });

    return () => { mounted = false; };
  }, [key, tab, defaultValue, updateCounter]);

  return value;
};

// Hook for colors
export const useCureColor = (key, defaultValue = '#000000') => {
  const { updateCounter } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let mounted = true;
    
    Cure.colorValue(key).then(result => {
      if (mounted) {
        setValue(result || defaultValue);
      }
    }).catch(() => {
      if (mounted) {
        setValue(defaultValue);
      }
    });

    return () => { mounted = false; };
  }, [key, defaultValue, updateCounter]);

  return value;
};

// Hook for images
export const useCureImage = (key, tab = null) => {
  const { updateCounter } = useCMSCureContext();
  const [value, setValue] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    if (tab) {
      Cure.translation(key, tab).then(result => {
        if (mounted) {
          setValue(result || null);
        }
      }).catch(() => {
        if (mounted) {
          setValue(null);
        }
      });
    } else {
      Cure.imageURL(key).then(result => {
        if (mounted) {
          setValue(result || null);
        }
      }).catch(() => {
        if (mounted) {
          setValue(null);
        }
      });
    }

    return () => { mounted = false; };
  }, [key, tab, updateCounter]);

  return value;
};

// Hook for data stores
export const useCureDataStore = (apiIdentifier) => {
  const { updateCounter } = useCMSCureContext();
  const [state, setState] = useState({ 
    items: [], 
    isLoading: true 
  });

  // This effect now handles BOTH initial fetch and live updates.
  useEffect(() => {
    let isMounted = true;

    const syncAndSetData = async () => {
      if (isMounted) {
        setState(s => ({ ...s, isLoading: true }));
      }
      try {
        const freshItems = await Cure.syncStore(apiIdentifier);
        if (isMounted) {
          setState({ items: freshItems || [], isLoading: false });
        }
      } catch (error) {
        console.error(`CMSCure: Failed to sync '${apiIdentifier}':`, error);
        if (isMounted) {
          // On failure, try to get from cache, then settle.
          const cachedItems = await Cure.getStoreItems(apiIdentifier);
          setState({ items: cachedItems || [], isLoading: false });
        }
      }
    };

    const refreshFromCache = async () => {
       try {
        const cachedItems = await Cure.getStoreItems(apiIdentifier);
        if (isMounted) {
          setState(s => ({ ...s, items: cachedItems || [] }));
        }
      } catch (error) {
        console.error(`CMSCure: Failed to refresh '${apiIdentifier}' from cache:`, error);
      }
    }

    // This is the trigger logic
    if (state.isLoading) {
      // If it's the very first load, always sync.
      syncAndSetData();
    } else {
      // For subsequent updates, only refresh if the event is for this store
      // or if it's a global "ALL" update.
      if (updateCounter?.id === apiIdentifier || updateCounter?.id === '__ALL_SCREENS_UPDATED__') {
        refreshFromCache();
      }
    }

    return () => { isMounted = false; };
  }, [apiIdentifier, updateCounter]); // Depends on both identifier and the update event

  return state;
};

// Image component
export const CureSDKImage = ({ url, style, ...props }) => {
  if (!url) return null;
  
  return (
    <Image 
      source={{ uri: url }} 
      style={style}
      {...props}  
    />
  );
}; 

// Re-export everything
export default Cure;