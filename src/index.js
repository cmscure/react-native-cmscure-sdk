import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-cmscure-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install' in the 'ios' directory\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const CMSCureSDKNative = NativeModules.CMSCureSDK
  ? NativeModules.CMSCureSDK
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

let eventEmitterInstance;
if (NativeModules.CMSCureSDK) {
  eventEmitterInstance = new NativeEventEmitter(CMSCureSDKNative);
} else {
  console.warn("CMSCureSDK: Native module not found, event emitter will not be functional. Ensure the library is linked correctly.");
}

const CMSCureSDK = {
  /**
   * Configures the CMSCureSDK with necessary project credentials.
   * Server and Socket URLs are hardcoded within the SDK.
   * This method MUST be called once, typically early in your application's lifecycle.
   *
   * @param {object} options - The configuration options.
   * @param {string} options.projectId - Your unique Project ID from the CMSCure dashboard.
   * @param {string} options.apiKey - Your secret API Key from the CMSCure dashboard.
   * @param {string} options.projectSecret - Your Project Secret from the CMSCure dashboard.
   * @returns {Promise<void | string>} A promise that resolves if configuration is successful, or rejects with an error. May resolve with a warning string on older Android versions.
   */
  configure: (options) => {
    if (!options || typeof options !== 'object') {
      return Promise.reject(new Error("CMSCureSDK: Configuration options object is required."));
    }
    const requiredKeys = ['projectId', 'apiKey', 'projectSecret'];
    for (const key of requiredKeys) {
      if (!options[key] || typeof options[key] !== 'string' || options[key].trim() === '') {
        return Promise.reject(new Error(`CMSCureSDK: '${key}' is required and must be a non-empty string.`));
      }
    }
    // Remove pollingIntervalSeconds if it exists, as it's no longer used
    const { pollingIntervalSeconds, ...nativeOptions } = options;
    if (pollingIntervalSeconds !== undefined) {
        console.warn("CMSCureSDK: 'pollingIntervalSeconds' is deprecated and no longer used. Updates are real-time via WebSockets.");
    }

    // Server and Socket URLs are now hardcoded in the native modules.
    // Only pass essential credentials.
    return CMSCureSDKNative.configure(nativeOptions);
  },

  setLanguage: (languageCode, force = false) => {
    if (typeof languageCode !== 'string' || languageCode.trim() === '') {
        return Promise.reject(new Error("CMSCureSDK: 'languageCode' must be a non-empty string."));
    }
    return CMSCureSDKNative.setLanguage(languageCode, force);
  },

  getLanguage: () => {
    return CMSCureSDKNative.getLanguage();
  },

  getAvailableLanguages: () => {
    return CMSCureSDKNative.getAvailableLanguages();
  },

  startListening: () => {
    return CMSCureSDKNative.startListening();
  },

  translation: (key, tab) => {
    if (typeof key !== 'string' || key.trim() === '' || typeof tab !== 'string' || tab.trim() === '') {
        return Promise.reject(new Error("CMSCureSDK: 'key' and 'tab' must be non-empty strings for translation."));
    }
    return CMSCureSDKNative.translation(key, tab);
  },

  colorValue: (key) => {
    if (typeof key !== 'string' || key.trim() === '') {
        return Promise.reject(new Error("CMSCureSDK: 'key' must be a non-empty string for colorValue."));
    }
    return CMSCureSDKNative.colorValue(key);
  },

  imageUrl: (key, tab) => {
     if (typeof key !== 'string' || key.trim() === '' || typeof tab !== 'string' || tab.trim() === '') {
        return Promise.reject(new Error("CMSCureSDK: 'key' and 'tab' must be non-empty strings for imageUrl."));
    }
    return CMSCureSDKNative.imageUrl(key, tab);
  },

  sync: (screenName) => {
    if (typeof screenName !== 'string' || screenName.trim() === '') {
        return Promise.reject(new Error("CMSCureSDK: 'screenName' must be a non-empty string for sync."));
    }
    return CMSCureSDKNative.sync(screenName);
  },

  isConnected: () => {
    return CMSCureSDKNative.isConnected();
  },

  setDebugLogsEnabled: (enabled) => {
    if (typeof enabled !== 'boolean') {
      return Promise.reject(new Error("CMSCureSDK: 'enabled' must be a boolean for setDebugLogsEnabled."));
    }
    return CMSCureSDKNative.setDebugLogsEnabled(enabled);
  },

  clearCache: () => {
    return CMSCureSDKNative.clearCache();
  },

  syncAllTabs: async () => {
    try {
      const tabs = await CMSCureSDKNative.getKnownTabs?.();
      if (Array.isArray(tabs)) {
        await Promise.all(tabs.map((tab) => CMSCureSDK.sync(tab)));
      } else {
        console.warn("CMSCureSDK: getKnownTabs() returned invalid data or is not available.");
      }
    } catch (err) {
      console.warn("CMSCureSDK: Failed to dynamically sync all tabs:", err);
    }
  },

  addContentUpdateListener: (listenerCallback) => {
    if (!eventEmitterInstance) {
        console.warn("CMSCureSDK: NativeEventEmitter not initialized. Cannot add listener.");
        return undefined;
    }
    return eventEmitterInstance.addListener('CMSCureContentUpdated', listenerCallback);
  },

  removeContentUpdateListener: (subscription) => {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
  },

  removeAllContentUpdateListeners: () => {
    if (eventEmitterInstance && typeof eventEmitterInstance.removeAllListeners === 'function') {
      eventEmitterInstance.removeAllListeners('CMSCureContentUpdated');
      console.log("CMSCureSDK: All listeners for 'CMSCureContentUpdated' have been removed.");
    } else {
      console.warn("CMSCureSDK: NativeEventEmitter not initialized. Cannot remove all listeners.");
    }
  },
};

export default CMSCureSDK;
