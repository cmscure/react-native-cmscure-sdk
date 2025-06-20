// src/index.js

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Image } from 'react-native';

const { CMSCureSDKModule } = NativeModules;

if (!CMSCureSDKModule) {
  throw new Error("CMSCureSDK: Native module is not available. Please check your installation and configuration.");
}

const eventEmitter = new NativeEventEmitter(CMSCureSDKModule);
const CMSCureContext = createContext(null);

// --- Provider Component ---

export const CMSCureProvider = ({ children }) => {
  const [sdkData, setSdkData] = useState({
    translations: {},
    colors: {},
    images: {},
    dataStores: {},
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Initial data fetch
    const fetchInitialData = async () => {
        try {
            // Sync important screens
            await CMSCureSDKModule.sync("__colors__");
            await CMSCureSDKModule.sync("__images__");
            await CMSCureSDKModule.sync(CMSKeys.COMMON_CONFIG_TAB);
            await CMSCureSDKModule.sync(CMSKeys.HOME_SCREEN_TAB);
            setIsReady(true);
        } catch (error) {
            console.error('[RN] Initial sync failed:', error);
        }
    };
    
    fetchInitialData();
    
    const listener = eventEmitter.addListener('onContentUpdated', (update) => {
        if (!isMounted) return;
        const { type, identifier } = update;
        
        console.log(`[RN] Received update: ${type} for ${identifier}`);

        switch (type) {
            case 'translations':
            case 'colors':
            case 'images':
            case 'fullSync':
                // Force a re-render by updating a dummy state
                setSdkData(prev => ({ ...prev, _updateToken: Date.now() }));
                break;
            case 'dataStore':
                CMSCureSDKModule.getStoreItems(identifier).then(data => {
                    setSdkData(prev => ({ 
                        ...prev, 
                        dataStores: { 
                            ...prev.dataStores, 
                            [identifier]: { items: data, isLoading: false } 
                        } 
                    }));
                }).catch(error => {
                    console.error(`[RN] Failed to fetch store items for ${identifier}:`, error);
                });
                break;
        }
    });

    return () => {
        isMounted = false;
        listener.remove();
    };
}, []);

  return (
    <CMSCureContext.Provider value={{ ...sdkData, isReady }}>
      {children}
    </CMSCureContext.Provider>
  );
};

// --- Custom Hooks ---

const useCureContext = () => {
  const context = useContext(CMSCureContext);
  if (!context) {
    throw new Error('useCure hooks must be used within a CMSCureProvider.');
  }
  return context;
};

export const useCureString = (key, tab, fallback = '') => {
  const { translations } = useCureContext();
  return useMemo(() => translations?.[tab]?.[key] || fallback, [translations, key, tab, fallback]);
};

export const useCureColor = (key, fallback = '#000000') => {
  const { colors } = useCureContext();
  return useMemo(() => colors?.[key] || fallback, [colors, key, fallback]);
};

export const useCureImage = (key, tab) => {
  const { images, translations } = useCureContext();
  return useMemo(() => {
    if (tab) {
      return translations?.[tab]?.[key] || null;
    }
    return images?.[key] || null;
  }, [images, translations, key, tab]);
};

export const useCureDataStore = (apiIdentifier) => {
  const { dataStores } = useCureContext();
  
  const sync = useCallback(() => {
    CMSCureSDKModule.syncStore(apiIdentifier);
  }, [apiIdentifier]);
  
  useEffect(() => {
    // Initial sync when hook is used
    sync();
  }, [sync]);

  return useMemo(() => ({
    items: dataStores?.[apiIdentifier]?.items || [],
    isLoading: dataStores?.[apiIdentifier]?.isLoading !== false,
    sync, // Expose sync function
  }), [dataStores, apiIdentifier, sync]);
};


// --- SDK Image Component ---

export const CureSDKImage = ({ url, ...props }) => {
  const source = useMemo(() => (url ? { uri: url } : null), [url]);
  if (!source) return null;
  return <Image source={source} {...props} />;
};


// --- Manual API ---

export const Cure = {
  configure: (config) => CMSCureSDKModule.configure(config),
  configure: (config) => {
    if (Platform.OS === 'ios') {
      return CMSCureSDKModule.configure(
        config.projectId,
        config.apiKey,
        config.projectSecret
      );
    }
    return CMSCureSDKModule.configure(config);
  },
  setLanguage: (code) => CMSCureSDKModule.setLanguage(code),
  getLanguage: () => CMSCureSDKModule.getLanguage(),
  availableLanguages: () => CMSCureSDKModule.availableLanguages(),
  syncStore: (apiIdentifier) => CMSCureSDKModule.syncStore(apiIdentifier),
  sync:            (screenName)      => CMSCureSDKModule.sync(screenName),
  getStoreItems:   (id)              => CMSCureSDKModule.getStoreItems(id),
  translation:     (key, tab)        => CMSCureSDKModule.translation(key, tab),
  colorValue:      (key)             => CMSCureSDKModule.colorValue(key),
  imageUrl:        (key, tab)        => CMSCureSDKModule.imageUrl(key, tab),
  imageURL:        (key)             => CMSCureSDKModule.imageURL(key),
};