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
  const [updateToken, setUpdateToken] = useState(0);
  const dataStoreCache = useRef({});
  const translationCache = useRef({});
  const colorCache = useRef({});
  const imageCache = useRef({});

  useEffect(() => {
    let subscription;
    let isMounted = true;
    
    const initializeSDK = async () => {
      if (config && isMounted) {
        try {
          await Cure.configure(config);
          
          // Initial sync of critical data
          await Promise.all([
            Cure.sync('__colors__'),
            Cure.sync('__images__'),
            Cure.sync('common_config'),
            Cure.sync('home_screen')
          ]);
          
          if (isMounted) {
            setIsInitialized(true);
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
          // Clear the cache for this datastore to force fresh fetch
          delete dataStoreCache.current[identifier];
          // Force re-render which will trigger useCureDataStore to refetch
          setUpdateToken(prev => prev + 1);
        } catch (err) {
          console.error(`Failed to update datastore ${identifier}:`, err);
        }
      } else if (type === 'colors' || type === 'images' || type === 'translation' || type === 'all') {
        // Clear relevant caches and force re-render
        if (type === 'colors' || type === 'all') {
          colorCache.current = {};
        }
        if (type === 'images' || type === 'all') {
          imageCache.current = {};
        }
        if (type === 'translation' || type === 'all') {
          translationCache.current = {};
        }
        if (type === 'all') {
          // Also clear all datastore caches on full sync
          dataStoreCache.current = {};
        }
        setUpdateToken(prev => prev + 1);
      }
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [config]);

  const contextValue = useMemo(() => ({
    isInitialized,
    updateToken,
    dataStoreCache: dataStoreCache.current,
    translationCache: translationCache.current,
    colorCache: colorCache.current,
    imageCache: imageCache.current
  }), [isInitialized, updateToken]);

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
  const { updateToken, translationCache } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);
  const cacheKey = `${tab}:${key}`;

  useEffect(() => {
    // Check cache first
    if (translationCache[cacheKey] !== undefined) {
      setValue(translationCache[cacheKey]);
      return;
    }

    // Fetch from native
    Cure.translation(key, tab).then(result => {
      const finalValue = result || defaultValue;
      translationCache[cacheKey] = finalValue;
      setValue(finalValue);
    }).catch(() => {
      setValue(defaultValue);
    });
  }, [key, tab, defaultValue, updateToken, cacheKey, translationCache]);

  return value;
};

// Hook for colors
export const useCureColor = (key, defaultValue = '#000000') => {
  const { updateToken, colorCache } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    // Check cache first
    if (colorCache[key] !== undefined) {
      setValue(colorCache[key]);
      return;
    }

    // Fetch from native
    Cure.colorValue(key).then(result => {
      const finalValue = result || defaultValue;
      colorCache[key] = finalValue;
      setValue(finalValue);
    }).catch(() => {
      setValue(defaultValue);
    });
  }, [key, defaultValue, updateToken, colorCache]);

  return value;
};

// Hook for images
export const useCureImage = (key, tab = null) => {
  const { updateToken, imageCache, translationCache } = useCMSCureContext();
  const [value, setValue] = useState(null);
  const cacheKey = tab ? `${tab}:${key}` : key;

  useEffect(() => {
    // Check cache first
    const cache = tab ? translationCache : imageCache;
    if (cache[cacheKey] !== undefined) {
      setValue(cache[cacheKey]);
      return;
    }

    // Fetch from native
    if (tab) {
      Cure.translation(key, tab).then(result => {
        cache[cacheKey] = result || null;
        setValue(result || null);
      }).catch(() => {
        setValue(null);
      });
    } else {
      Cure.imageURL(key).then(result => {
        cache[cacheKey] = result || null;
        setValue(result || null);
      }).catch(() => {
        setValue(null);
      });
    }
  }, [key, tab, updateToken, cacheKey, imageCache, translationCache]);

  return value;
};

// Hook for data stores
export const useCureDataStore = (apiIdentifier) => {
  const { updateToken, dataStoreCache } = useCMSCureContext();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => { 
      try {
        setIsLoading(true);
        
        // Check if we have cached data and it's not been invalidated
        if (dataStoreCache[apiIdentifier] && lastUpdate === updateToken) {
          setItems(dataStoreCache[apiIdentifier]);
          setIsLoading(false);
          return;
        }
        
        // Sync to get fresh data
        await Cure.syncStore(apiIdentifier);
        const freshItems = await Cure.getStoreItems(apiIdentifier);
        
        if (mounted) {
          dataStoreCache[apiIdentifier] = freshItems;
          setItems(freshItems);
          setIsLoading(false);
          setLastUpdate(updateToken);
        }
      } catch (error) {
        console.error(`Failed to fetch datastore ${apiIdentifier}:`, error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [apiIdentifier, updateToken, dataStoreCache, lastUpdate]);

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