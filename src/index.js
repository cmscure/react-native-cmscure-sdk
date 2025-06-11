import { NativeModules, NativeEventEmitter, Image } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';

const { CMSCureSDKModule } = NativeModules;

if (!CMSCureSDKModule) {
  throw new Error("CMSCureSDK: Native module is not available. Please check your installation.");
}

const eventEmitter = new NativeEventEmitter(CMSCureSDKModule);

const Constants = {
  COLORS_UPDATED: '__COLORS_UPDATED__',
  IMAGES_UPDATED: '__IMAGES_UPDATED__',
  ALL_SCREENS_UPDATED: '__ALL_SCREENS_UPDATED__',
};

/**
 * Main API for interacting with the CMSCure SDK.
 */
export const Cure = {
  /**
   * Configures the SDK with your project credentials. Must be called once on app startup.
   * @param {object} config - The configuration object.
   * @param {string} config.projectId - Your project's ID.
   * @param {string} config.apiKey - Your project's API key.
   * @param {string} config.projectSecret - Your project's secret key.
   * @returns {Promise<string>} A promise that resolves on successful initiation.
   */
  configure: ({ projectId, apiKey, projectSecret }) => {
    return CMSCureSDKModule.configure(projectId, apiKey, projectSecret);
  },

  /**
   * Sets the active language for translations.
   * @param {string} languageCode - The language code (e.g., 'en', 'fr').
   * @returns {Promise<string>}
   */
  setLanguage: (languageCode) => {
    return CMSCureSDKModule.setLanguage(languageCode);
  },

  /**
   * Gets the currently active language code.
   * @returns {Promise<string>}
   */
  getLanguage: () => {
    return CMSCureSDKModule.getLanguage();
  },

  /**
   * Fetches the list of available languages for the project.
   * @returns {Promise<string[]>}
   */
  availableLanguages: () => {
    return CMSCureSDKModule.availableLanguages();
  },

  /**
   * Manually triggers a sync for a specific screen/tab.
   * @param {string} screenName - The name of the screen to sync.
   * @returns {Promise<boolean>}
   */
  sync: (screenName) => {
    return CMSCureSDKModule.sync(screenName);
  },
  
  /** Constants for special update events. */
  Events: Constants,
};

// --- REACT HOOKS ---

/**
 * A hook that provides a live translation string from the CMS.
 * It automatically updates when the language changes or real-time updates are received.
 * @param {string} key - The translation key.
 * @param {string} tab - The tab/screen name where the key is located.
 * @returns {string} The translated string.
 */
export const useCureTranslation = (key, tab) => {
  const [value, setValue] = useState('');

  const updateValue = async () => {
    const newValue = await CMSCureSDKModule.translation(key, tab);
    setValue(newValue);
  };

  useEffect(() => {
    updateValue(); // Initial fetch

    const subscription = eventEmitter.addListener('onContentUpdated', (updatedIdentifier) => {
      // Re-fetch if the relevant tab was updated, or if all tabs were updated
      if (updatedIdentifier === tab || updatedIdentifier === Constants.ALL_SCREENS_UPDATED) {
        updateValue();
      }
    });

    return () => subscription.remove();
  }, [key, tab]);

  return value;
};

/**
 * A hook that provides a live color hex string from the CMS.
 * @param {string} key - The global color key.
 * @returns {string | null} The color hex string (e.g., '#RRGGBB') or null.
 */
export const useCureColor = (key) => {
  const [value, setValue] = useState(null);

  const updateValue = async () => {
    const newValue = await CMSCureSDKModule.colorValue(key);
    setValue(newValue);
  };

  useEffect(() => {
    updateValue();

    const subscription = eventEmitter.addListener('onContentUpdated', (updatedIdentifier) => {
      if (updatedIdentifier === Constants.COLORS_UPDATED || updatedIdentifier === Constants.ALL_SCREENS_UPDATED) {
        updateValue();
      }
    });

    return () => subscription.remove();
  }, [key]);

  return value;
};

/**
 * A hook that provides a live, screen-dependent image URL from the CMS.
 * @param {string} key - The key for the image URL.
 * @param {string} tab - The tab/screen name where the key is located.
 * @returns {string | null} The image URL string or null.
 */
export const useCureImageUrl = (key, tab) => {
    const [value, setValue] = useState(null);

    const updateValue = async () => {
        const newValue = await CMSCureSDKModule.imageUrl(key, tab);
        setValue(newValue);
    };

    useEffect(() => {
        updateValue();
        const subscription = eventEmitter.addListener('onContentUpdated', (updatedIdentifier) => {
            if (updatedIdentifier === tab || updatedIdentifier === Constants.ALL_SCREENS_UPDATED) {
                updateValue();
            }
        });
        return () => subscription.remove();
    }, [key, tab]);

    return value;
};

/**
 * A hook that provides a live, global image asset URL from the CMS.
 * @param {string} assetKey - The key for the global image asset.
 * @returns {string | null} The image URL string or null.
 */
export const useCureImageURL = (assetKey) => {
    const [value, setValue] = useState(null);

    const updateValue = async () => {
        const newValue = await CMSCureSDKModule.imageURL(assetKey);
        setValue(newValue);
    };

    useEffect(() => {
        updateValue();
        const subscription = eventEmitter.addListener('onContentUpdated', (updatedIdentifier) => {
            if (updatedIdentifier === Constants.IMAGES_UPDATED || updatedIdentifier === Constants.ALL_SCREENS_UPDATED) {
                updateValue();
            }
        });
        return () => subscription.remove();
    }, [assetKey]);

    return value;
};


// --- REACT COMPONENTS ---

/**
 * A ready-to-use, cache-enabled component for displaying images from CMSCure.
 * It leverages the native caching capabilities provided by Kingfisher (iOS) and Coil (Android).
 *
 * @param {object} props - The component props.
 * @param {string | null} props.url - The image URL, typically from `useCureImageURL`.
 * @param {object} [props.style] - Style for the image component.
 * @param {string} [props.resizeMode] - The resize mode for the image.
 * @param {React.ReactNode} [props.placeholder] - A component to show while the image is loading.
 * @returns {React.Component}
 */
export const SDKImage = ({ url, style, resizeMode = 'cover', placeholder = null, ...props }) => {
  const source = useMemo(() => (url ? { uri: url } : null), [url]);

  if (!source) {
    return placeholder;
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      {...props}
    />
  );
};