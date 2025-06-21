import { 
  NativeModules, 
  NativeEventEmitter, 
  Platform,
  Image 
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
  const [, forceUpdate] = useState({});
  
  // Use refs for data that shouldn't trigger re-renders
  const dataStoresRef = useRef({});
  const updateCounterRef = useRef(0);

  useEffect(() => {
    let subscription;
    let isMounted = true;
    
    const initializeSDK = async () => {
      if (config && isMounted) {
        try {
          console.log('Initializing CMSCure SDK...');
          await Cure.configure(config);
          
          // Initial sync of critical data
          await Promise.all([
            Cure.sync('__colors__'),
            Cure.sync('__images__'),
            Cure.sync('common_config'),
            Cure.sync('home_screen')
          ]);
          
          // Initial fetch of known data stores
          const knownStores = ['popular_destinations', 'featured_destinations'];
          for (const store of knownStores) {
            try {
              await Cure.syncStore(store);
              const items = await Cure.getStoreItems(store);
              dataStoresRef.current[store] = {
                items,
                lastFetch: Date.now()
              };
            } catch (err) {
              console.log(`Initial fetch of ${store} failed:`, err);
            }
          }
          
          if (isMounted) {
            setIsInitialized(true);
            forceUpdate({});
          }
        } catch (error) {
          console.error('Failed to initialize CMSCure SDK:', error);
        }
      }
    };

    initializeSDK();

    // Set up event listener
    subscription = eventEmitter.addListener('CMSCureContentUpdate', async (event) => {
      if (!isMounted) return;
      
      console.log('Content update received:', event);
      
      const { type, identifier } = event;
      
      // Handle data store updates
      if (type === 'dataStore' && identifier) {
        try {
          // Always fetch fresh data on update
          await Cure.syncStore(identifier);
          const items = await Cure.getStoreItems(identifier);
          
          // Update the ref with fresh data
          dataStoresRef.current[identifier] = {
            items,
            lastFetch: Date.now()
          };
          
          // Force all components to re-render
          updateCounterRef.current += 1;
          forceUpdate({});
        } catch (err) {
          console.error(`Failed to fetch datastore ${identifier}:`, err);
        }
      } else {
        // For other updates, increment counter
        updateCounterRef.current += 1;
        forceUpdate({});
      }
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [config]);

  const contextValue = useMemo(() => ({
    isInitialized,
    dataStores: dataStoresRef.current,
    updateCounter: updateCounterRef.current
  }), [isInitialized, updateCounterRef.current]);

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
  const { dataStores, updateCounter } = useCMSCureContext();
  const [state, setState] = useState({ items: [], isLoading: true });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        // Check if we have recent data
        const cached = dataStores[apiIdentifier];
        if (cached && cached.items) {
          setState({ items: cached.items, isLoading: false });
          
          // If data is older than 5 seconds, refresh it
          if (Date.now() - cached.lastFetch > 5000) {
            const freshItems = await Cure.getStoreItems(apiIdentifier);
            if (mounted) {
              dataStores[apiIdentifier] = {
                items: freshItems,
                lastFetch: Date.now()
              };
              setState({ items: freshItems, isLoading: false });
            }
          }
        } else {
          // No cache, fetch fresh
          await Cure.syncStore(apiIdentifier);
          const freshItems = await Cure.getStoreItems(apiIdentifier);
          
          if (mounted) {
            dataStores[apiIdentifier] = {
              items: freshItems,
              lastFetch: Date.now()
            };
            setState({ items: freshItems, isLoading: false });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch datastore ${apiIdentifier}:`, error);
        if (mounted) {
          setState({ items: [], isLoading: false });
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [apiIdentifier, dataStores, updateCounter]);

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