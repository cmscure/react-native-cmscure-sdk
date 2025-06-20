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
  useCallback 
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
  const [updateToken, setUpdateToken] = useState(0);
  const cacheRef = useRef({
    translations: {},
    colors: {},
    images: {},
    dataStores: {}
  });

  useEffect(() => {
    let subscription;
    
    const initializeSDK = async () => {
      if (config) {
        try {
          await Cure.configure(config);
          setIsInitialized(true);
          
          // Initial sync of critical data
          await Promise.all([
            Cure.sync('__colors__'),
            Cure.sync('__images__')
          ]);
        } catch (error) {
          console.error('Failed to initialize CMSCure SDK:', error);
        }
      }
    };

    initializeSDK();

    // Set up event listener
    subscription = eventEmitter.addListener('CMSCureContentUpdate', (event) => {
      console.log('Content update received:', event);
      
      const { type, identifier } = event;
      
      // Force re-render of components using this data
      setUpdateToken(prev => prev + 1);
      
      // Handle data store updates
      if (type === 'dataStore' && identifier) {
        Cure.getStoreItems(identifier).then(items => {
          cacheRef.current.dataStores[identifier] = items;
          setUpdateToken(prev => prev + 1);
        }).catch(err => {
          console.error(`Failed to fetch datastore ${identifier}:`, err);
        });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [config]);

  const contextValue = {
    isInitialized,
    updateToken,
    cache: cacheRef.current
  };

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
  const { updateToken } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    Cure.translation(key, tab).then(result => {
      setValue(result || defaultValue);
    }).catch(() => {
      setValue(defaultValue);
    });
  }, [key, tab, defaultValue, updateToken]);

  return value;
};

// Hook for colors
export const useCureColor = (key, defaultValue = '#000000') => {
  const { updateToken } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    Cure.colorValue(key).then(result => {
      setValue(result || defaultValue);
    }).catch(() => {
      setValue(defaultValue);
    });
  }, [key, defaultValue, updateToken]);

  return value;
};

// Hook for images
export const useCureImage = (key, tab = null) => {
  const { updateToken } = useCMSCureContext();
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (tab) {
      Cure.translation(key, tab).then(result => {
        setValue(result || null);
      }).catch(() => {
        setValue(null);
      });
    } else {
      Cure.imageURL(key).then(result => {
        setValue(result || null);
      }).catch(() => {
        setValue(null);
      });
    }
  }, [key, tab, updateToken]);

  return value;
};

// Hook for data stores
export const useCureDataStore = (apiIdentifier) => {
  const { updateToken, cache } = useCMSCureContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // First try to get from cache
        if (cache.dataStores[apiIdentifier]) {
          setItems(cache.dataStores[apiIdentifier]);
        }
        
        // Then sync from server
        await Cure.syncStore(apiIdentifier);
        const freshItems = await Cure.getStoreItems(apiIdentifier);
        
        if (mounted) {
          setItems(freshItems);
          cache.dataStores[apiIdentifier] = freshItems;
        }
      } catch (error) {
        console.error(`Failed to fetch datastore ${apiIdentifier}:`, error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [apiIdentifier, updateToken, cache]);

  return { items, isLoading };
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