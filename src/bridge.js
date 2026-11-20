// Native bridge (iOS and Android). Web uses bridge.web.js instead; Metro and
// webpack pick the .web.js file on their own for react-native-web builds.
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { CMSCureSDK } = NativeModules;

if (!CMSCureSDK) {
  throw new Error(
    'CMSCureSDK native module is not available. ' +
    'Rebuild your app after installing the package. ' +
    'In Expo, add "@cmscure/react-native-cmscure-sdk" to plugins and use a development build ' +
    '(Expo Go cannot load this module).'
  );
}

const eventEmitter = new NativeEventEmitter(CMSCureSDK);

export const bridge = {
  configure: ({ projectId, apiKey, projectSecret, enableAutoRealTimeUpdates }) => {
    if (Platform.OS === 'ios') {
      return CMSCureSDK.configure(projectId, apiKey, projectSecret);
    }
    return CMSCureSDK.configure(projectId, apiKey, projectSecret, enableAutoRealTimeUpdates);
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
  /** listener receives { identifier, type }. Returns a subscription with remove(). */
  addUpdateListener: (listener) => eventEmitter.addListener('CMSCureContentUpdate', listener),
};
