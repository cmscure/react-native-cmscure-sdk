// Web bridge for react-native-web (browser previews, Expo web). Same surface
// as bridge.js, backed by the pure JS SDK instead of the native module.
// Read only like the native SDKs: it only downloads published content.
import { CMSCureSDK } from '@cmscure/javascript-sdk';

const PROBE_KEY = '__cmscure_probe__';
const STORE_WAIT_MS = 5000;

const COLORS = '__colors__';
const IMAGES = '__images__';
const ALL = '__ALL_SCREENS_UPDATED__';

let cure = null;
const getCure = () => {
  if (!cure) cure = new CMSCureSDK();
  return cure;
};

// contentUpdated detail -> the { identifier, type } event the native SDKs send.
const toNativeEvent = (detail = {}) => {
  if (detail.store) return { identifier: detail.store, type: 'dataStore' };
  if (detail.tab) return { identifier: detail.tab, type: 'translation' };
  if (detail.reason === 'ColorsSynced') return { identifier: COLORS, type: 'colors' };
  if (detail.reason === 'ImagesSynced') return { identifier: IMAGES, type: 'images' };
  return { identifier: ALL, type: 'all' };
};

const isLocalizedObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0 &&
  Object.values(value).every((v) => typeof v === 'string');

// Plain or localized field value -> the JSONValue shape the native SDKs return.
const toJSONValue = (value, language) => {
  if (value === null || value === undefined) {
    return { stringValue: null, localizedString: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value, localizedString: value };
  }
  if (typeof value === 'number') {
    const text = String(value);
    return Number.isInteger(value)
      ? { intValue: value, stringValue: text, localizedString: text }
      : { doubleValue: value, stringValue: text, localizedString: text };
  }
  if (typeof value === 'boolean') {
    const text = String(value);
    return { boolValue: value, stringValue: text, localizedString: text };
  }
  if (isLocalizedObject(value)) {
    const base = (language || 'en').split(/[-_]/)[0];
    const text = value[language] ?? value[base] ?? value.en ?? Object.values(value)[0] ?? '';
    return { stringValue: text, localizedString: text, values: value };
  }
  const text = JSON.stringify(value);
  return { stringValue: text, localizedString: text };
};

const toNativeItem = (item, language) => {
  const data = {};
  Object.entries(item.data || {}).forEach(([key, value]) => {
    data[key] = toJSONValue(value, language);
  });
  if (item.ctaUrl && !data.cta_url) {
    data.cta_url = toJSONValue(item.ctaUrl, language);
  }
  const isActive = data.is_active?.boolValue !== false;
  return {
    id: String(item._id ?? item.id ?? ''),
    createdAt: item.createdAt ?? '',
    updatedAt: item.updatedAt ?? '',
    is_active: isActive,
    data,
  };
};

const readStore = (apiIdentifier) => {
  const sdk = getCure();
  const language = sdk.getLanguage();
  return (sdk.dataStore(apiIdentifier, []) || [])
    .map((item) => toNativeItem(item, language))
    .filter((item) => item.is_active);
};

const waitForStore = (apiIdentifier) =>
  new Promise((resolve) => {
    const sdk = getCure();
    let timer = null;
    const done = () => {
      clearTimeout(timer);
      sdk.removeEventListener('contentUpdated', onUpdate);
      resolve();
    };
    const onUpdate = (event) => {
      const detail = event.detail || {};
      if (detail.store === apiIdentifier || detail.reason === 'InitialSyncComplete') done();
    };
    sdk.addEventListener('contentUpdated', onUpdate);
    timer = setTimeout(done, STORE_WAIT_MS);
  });

export const bridge = {
  configure: async ({ projectId, apiKey, projectSecret }) => {
    await getCure().configure({ projectId, apiKey, projectSecret });
    return true;
  },
  setLanguage: async (languageCode) => {
    await getCure().setLanguage(languageCode);
    return true;
  },
  getLanguage: async () => getCure().getLanguage() || 'en',
  availableLanguages: async () => getCure().getAvailableLanguages(),
  translation: async (key, tab) => getCure().translation(key, tab, ''),
  colorValue: async (key) => getCure().color(key, null),
  imageURL: async (key) => getCure().image(key, null),
  getStoreItems: async (apiIdentifier) => readStore(apiIdentifier),
  syncStore: async (apiIdentifier) => {
    const cached = readStore(apiIdentifier); // also starts the first sync
    if (cached.length > 0) return cached;
    await waitForStore(apiIdentifier);
    return readStore(apiIdentifier);
  },
  // The JS SDK syncs a resource the first time it is read, so reading a
  // probe key is enough to start the download.
  sync: async (screenName) => {
    const sdk = getCure();
    if (screenName === COLORS) sdk.color(PROBE_KEY, null);
    else if (screenName === IMAGES) sdk.image(PROBE_KEY, null);
    else sdk.translation(PROBE_KEY, screenName, '');
    return true;
  },
  addUpdateListener: (listener) => {
    const sdk = getCure();
    const handler = (event) => listener(toNativeEvent(event.detail));
    sdk.addEventListener('contentUpdated', handler);
    return { remove: () => sdk.removeEventListener('contentUpdated', handler) };
  },
};
