import { Image, View, ActivityIndicator } from 'react-native';
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useRef, 
  useMemo
} from 'react';
// Native module on iOS/Android, @cmscure/javascript-sdk on web (bridge.web.js).
import { bridge } from './bridge';

// ---------------------------------------------------------------------------
// Language Direction & Display Utilities (pure JS — no native bridge needed)
// ---------------------------------------------------------------------------

const RTL_LANGUAGES = new Set([
  'ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ku', 'yi', 'ckb', 'dv', 'ug',
]);

/** Returns 'RTL' or 'LTR' for a given language code. */
export const LanguageDirection = {
  direction: (code) => {
    const base = (code || 'en').toLowerCase().split(/[-_]/)[0];
    return RTL_LANGUAGES.has(base) ? 'RTL' : 'LTR';
  },
  isRTL: (code) => {
    const base = (code || 'en').toLowerCase().split(/[-_]/)[0];
    return RTL_LANGUAGES.has(base);
  },
};

const FLAGS = {
  af: '🇿🇦', am: '🇪🇹', ar: '🇸🇦', az: '🇦🇿',
  be: '🇧🇾', bg: '🇧🇬', bn: '🇧🇩', bs: '🇧🇦',
  ca: '🇪🇸', cs: '🇨🇿', cy: '🏴', da: '🇩🇰',
  de: '🇩🇪', el: '🇬🇷', en: '🇺🇸', es: '🇪🇸',
  et: '🇪🇪', eu: '🇪🇸', fa: '🇮🇷', fi: '🇫🇮',
  fil: '🇵🇭', fr: '🇫🇷', ga: '🇮🇪', gl: '🇪🇸',
  gu: '🇮🇳', ha: '🇳🇬', he: '🇮🇱', hi: '🇮🇳',
  hr: '🇭🇷', hu: '🇭🇺', hy: '🇦🇲', id: '🇮🇩',
  ig: '🇳🇬', is: '🇮🇸', it: '🇮🇹', ja: '🇯🇵',
  jv: '🇮🇩', ka: '🇬🇪', kk: '🇰🇿', km: '🇰🇭',
  kn: '🇮🇳', ko: '🇰🇷', ku: '🇮🇶', ky: '🇰🇬',
  lo: '🇱🇦', lt: '🇱🇹', lv: '🇱🇻', mg: '🇲🇬',
  mk: '🇲🇰', ml: '🇮🇳', mn: '🇲🇳', mr: '🇮🇳',
  ms: '🇲🇾', mt: '🇲🇹', my: '🇲🇲', nb: '🇳🇴',
  ne: '🇳🇵', nl: '🇳🇱', nn: '🇳🇴', no: '🇳🇴',
  or: '🇮🇳', pa: '🇮🇳', pl: '🇵🇱', ps: '🇦🇫',
  pt: '🇵🇹', ro: '🇷🇴', ru: '🇷🇺', rw: '🇷🇼',
  sd: '🇵🇰', si: '🇱🇰', sk: '🇸🇰', sl: '🇸🇮',
  so: '🇸🇴', sq: '🇦🇱', sr: '🇷🇸', sv: '🇸🇪',
  sw: '🇹🇿', ta: '🇮🇳', te: '🇮🇳', tg: '🇹🇯',
  th: '🇹🇭', tk: '🇹🇲', tl: '🇵🇭', tr: '🇹🇷',
  uk: '🇺🇦', ur: '🇵🇰', uz: '🇺🇿', vi: '🇻🇳',
  xh: '🇿🇦', yi: '🇮🇱', yo: '🇳🇬', zh: '🇨🇳',
  zu: '🇿🇦',
  'en-gb': '🇬🇧', 'en-au': '🇦🇺', 'en-ca': '🇨🇦', 'en-in': '🇮🇳',
  'es-mx': '🇲🇽', 'es-ar': '🇦🇷', 'fr-ca': '🇨🇦', 'fr-be': '🇧🇪',
  'pt-br': '🇧🇷', 'zh-tw': '🇹🇼', 'zh-hk': '🇭🇰',
};

const DISPLAY_NAMES = {
  af: 'Afrikaans', am: 'Amharic', ar: 'Arabic', az: 'Azerbaijani',
  be: 'Belarusian', bg: 'Bulgarian', bn: 'Bengali', bs: 'Bosnian',
  ca: 'Catalan', cs: 'Czech', cy: 'Welsh', da: 'Danish',
  de: 'German', el: 'Greek', en: 'English', es: 'Spanish',
  et: 'Estonian', eu: 'Basque', fa: 'Persian', fi: 'Finnish',
  fil: 'Filipino', fr: 'French', ga: 'Irish', gl: 'Galician',
  gu: 'Gujarati', ha: 'Hausa', he: 'Hebrew', hi: 'Hindi',
  hr: 'Croatian', hu: 'Hungarian', hy: 'Armenian', id: 'Indonesian',
  ig: 'Igbo', is: 'Icelandic', it: 'Italian', ja: 'Japanese',
  jv: 'Javanese', ka: 'Georgian', kk: 'Kazakh', km: 'Khmer',
  kn: 'Kannada', ko: 'Korean', ku: 'Kurdish', ky: 'Kyrgyz',
  lo: 'Lao', lt: 'Lithuanian', lv: 'Latvian', mg: 'Malagasy',
  mk: 'Macedonian', ml: 'Malayalam', mn: 'Mongolian', mr: 'Marathi',
  ms: 'Malay', mt: 'Maltese', my: 'Burmese', nb: 'Norwegian Bokmål',
  ne: 'Nepali', nl: 'Dutch', nn: 'Norwegian Nynorsk', no: 'Norwegian',
  or: 'Odia', pa: 'Punjabi', pl: 'Polish', ps: 'Pashto',
  pt: 'Portuguese', ro: 'Romanian', ru: 'Russian', rw: 'Kinyarwanda',
  sd: 'Sindhi', si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian',
  so: 'Somali', sq: 'Albanian', sr: 'Serbian', sv: 'Swedish',
  sw: 'Swahili', ta: 'Tamil', te: 'Telugu', tg: 'Tajik',
  th: 'Thai', tk: 'Turkmen', tl: 'Tagalog', tr: 'Turkish',
  uk: 'Ukrainian', ur: 'Urdu', uz: 'Uzbek', vi: 'Vietnamese',
  xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba', zh: 'Chinese',
  zu: 'Zulu',
  'en-gb': 'English (UK)', 'en-au': 'English (Australia)', 'en-ca': 'English (Canada)',
  'en-in': 'English (India)', 'es-mx': 'Spanish (Mexico)', 'es-ar': 'Spanish (Argentina)',
  'fr-ca': 'French (Canada)', 'fr-be': 'French (Belgium)', 'pt-br': 'Portuguese (Brazil)',
  'zh-tw': 'Chinese (Traditional)', 'zh-hk': 'Chinese (Hong Kong)',
};

/** Flag emoji and display name helpers. */
export const CureLanguageDisplay = {
  flag: (code) => {
    const lower = (code || '').toLowerCase();
    return FLAGS[lower] || FLAGS[lower.split(/[-_]/)[0]] || '🌐';
  },
  displayName: (code) => {
    const lower = (code || '').toLowerCase();
    return DISPLAY_NAMES[lower] || DISPLAY_NAMES[lower.split(/[-_]/)[0]] || code.toUpperCase();
  },
};

// ---------------------------------------------------------------------------
// DataStoreItem convenience helper
// ---------------------------------------------------------------------------

/** 
 * Wraps a raw DataStoreItem from the native bridge with typed accessors. 
 * Matches iOS/Android SDK convenience getters (string, int, double, bool, ctaURL).
 */
const wrapDataStoreItem = (raw) => {
  if (!raw) return raw;
  const data = raw.data || {};

  return {
    ...raw,
    /** Returns the localised/string value for a key, or null. */
    string: (key) => {
      const v = data[key];
      return v?.localizedString ?? v?.stringValue ?? null;
    },
    /** Returns the integer value for a key, or null. */
    int: (key) => {
      const v = data[key];
      if (v?.intValue != null) return v.intValue;
      if (v?.stringValue != null) { const n = parseInt(v.stringValue, 10); return isNaN(n) ? null : n; }
      return null;
    },
    /** Returns the double/float value for a key, or null. */
    double: (key) => {
      const v = data[key];
      if (v?.doubleValue != null) return v.doubleValue;
      if (v?.intValue != null) return v.intValue;
      if (v?.stringValue != null) { const n = parseFloat(v.stringValue); return isNaN(n) ? null : n; }
      return null;
    },
    /** Returns the boolean value for a key, or null. */
    bool: (key) => {
      const v = data[key];
      if (v?.boolValue != null) return v.boolValue;
      return null;
    },
    /** CTA / deep-link URL if a `cta_url` field exists and is non-empty. */
    get ctaURL() {
      const v = data.cta_url;
      const url = v?.stringValue ?? v?.localizedString ?? null;
      return url && url.trim().length > 0 ? url : null;
    },
  };
};

/** Wraps an array of raw items. */
const wrapDataStoreItems = (items) => (items || []).map(wrapDataStoreItem);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CMSCureContext = createContext(null);

// ---------------------------------------------------------------------------
// Core SDK API
// ---------------------------------------------------------------------------

export const Cure = {
  configure: async (config) => {
    const {
      projectId,
      apiKey,
      projectSecret,
      enableAutoRealTimeUpdates = true,
    } = config;

    if (!projectId || !apiKey || !projectSecret) {
      throw new Error('CMSCure configuration requires projectId, apiKey, and projectSecret.');
    }

    return bridge.configure({ projectId, apiKey, projectSecret, enableAutoRealTimeUpdates });
  },

  setLanguage: (languageCode) => bridge.setLanguage(languageCode),
  getLanguage: () => bridge.getLanguage(),
  availableLanguages: () => bridge.availableLanguages(),
  translation: (key, tab) => bridge.translation(key, tab),
  colorValue: (key) => bridge.colorValue(key),
  imageURL: (key) => bridge.imageURL(key),
  getStoreItems: async (apiIdentifier) => {
    const raw = await bridge.getStoreItems(apiIdentifier);
    return wrapDataStoreItems(raw);
  },
  syncStore: async (apiIdentifier) => {
    const raw = await bridge.syncStore(apiIdentifier);
    return wrapDataStoreItems(raw);
  },
  sync: (screenName) => bridge.sync(screenName),
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CMSCureConstants = {
  ALL_SCREENS_UPDATED: '__ALL_SCREENS_UPDATED__',
  COLORS_UPDATED: '__colors__',
  IMAGES_UPDATED: '__images__',
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const CMSCureProvider = ({ children, config }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const updateCounterRef = useRef(0);
  const [, forceRender] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSDK = async () => {
      if (config && isMounted) {
        try {
          await Cure.configure(config);

          await Promise.all([
            Cure.sync('__colors__'),
            Cure.sync('__images__'),
          ]);

          if (isMounted) {
            setIsInitialized(true);
          }
        } catch (error) {
          console.error('CMSCureProvider: Failed to initialize CMSCure SDK:', error);
        }
      }
    };

    initializeSDK();

    const subscription = bridge.addUpdateListener((event) => {
      if (!isMounted) return;
      updateCounterRef.current = { id: event.identifier, time: Date.now() };
      forceRender((c) => !c);
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [config]);

  const contextValue = useMemo(
    () => ({
      isInitialized,
      updateCounter: updateCounterRef.current,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isInitialized, updateCounterRef.current],
  );

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <CMSCureContext.Provider value={contextValue}>
      {children}
    </CMSCureContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const useCMSCureContext = () => {
  const context = useContext(CMSCureContext);
  if (!context) {
    throw new Error('useCMSCure hooks must be used within CMSCureProvider');
  }
  return context;
};

/** Reactive CMS translation string. Auto-updates on content changes. */
export const useCureString = (key, tab, defaultValue = '') => {
  const { updateCounter } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let mounted = true;
    Cure.translation(key, tab)
      .then((result) => { if (mounted) setValue(result || defaultValue); })
      .catch(() => { if (mounted) setValue(defaultValue); });
    return () => { mounted = false; };
  }, [key, tab, defaultValue, updateCounter]);

  return value;
};

/** Reactive CMS color hex string. Auto-updates on content changes. */
export const useCureColor = (key, defaultValue = '#000000') => {
  const { updateCounter } = useCMSCureContext();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    let mounted = true;
    Cure.colorValue(key)
      .then((result) => { if (mounted) setValue(result || defaultValue); })
      .catch(() => { if (mounted) setValue(defaultValue); });
    return () => { mounted = false; };
  }, [key, defaultValue, updateCounter]);

  return value;
};

/** Reactive CMS image URL.  Pass `tab` for translation-based images, omit for global images. */
export const useCureImage = (key, tab = null) => {
  const { updateCounter } = useCMSCureContext();
  const [value, setValue] = useState(null);

  useEffect(() => {
    let mounted = true;
    const promise = tab ? Cure.translation(key, tab) : Cure.imageURL(key);
    promise
      .then((result) => { if (mounted) setValue(result || null); })
      .catch(() => { if (mounted) setValue(null); });
    return () => { mounted = false; };
  }, [key, tab, updateCounter]);

  return value;
};

/** Reactive CMS data store. Returns `{ items, isLoading }` where each item has typed accessors. */
export const useCureDataStore = (apiIdentifier) => {
  const { updateCounter } = useCMSCureContext();
  const [state, setState] = useState({ items: [], isLoading: true });

  // Initial sync — runs once per apiIdentifier, not affected by updateCounter changes.
  useEffect(() => {
    let isMounted = true;

    const syncAndSet = async () => {
      try {
        const items = await Cure.syncStore(apiIdentifier);
        if (isMounted) setState({ items, isLoading: false });
      } catch (error) {
        console.error(`CMSCure: Failed to sync '${apiIdentifier}':`, error);
        try {
          const cached = await Cure.getStoreItems(apiIdentifier);
          if (isMounted) setState({ items: cached, isLoading: false });
        } catch (_) {
          if (isMounted) setState({ items: [], isLoading: false });
        }
      }
    };

    syncAndSet();
    return () => { isMounted = false; };
  }, [apiIdentifier]);

  // Refresh from cache when a real-time content update arrives for this store.
  useEffect(() => {
    if (
      updateCounter?.id === apiIdentifier ||
      updateCounter?.id === CMSCureConstants.ALL_SCREENS_UPDATED
    ) {
      let isMounted = true;
      Cure.getStoreItems(apiIdentifier)
        .then((cached) => { if (isMounted) setState((s) => ({ ...s, items: cached })); })
        .catch(() => {});
      return () => { isMounted = false; };
    }
  }, [apiIdentifier, updateCounter]);

  return state;
};

/** Returns the current language code and RTL flag, re-renders on language changes. */
export const useCureLanguage = () => {
  const { updateCounter } = useCMSCureContext();
  const [lang, setLang] = useState({ code: 'en', isRTL: false, flag: '🇺🇸', displayName: 'English' });

  useEffect(() => {
    let mounted = true;
    Cure.getLanguage()
      .then((code) => {
        if (mounted) {
          setLang({
            code,
            isRTL: LanguageDirection.isRTL(code),
            flag: CureLanguageDisplay.flag(code),
            displayName: CureLanguageDisplay.displayName(code),
          });
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [updateCounter]);

  return lang;
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Renders a CMS-managed image from a URL. Returns null when url is falsy. */
export const CureSDKImage = ({ url, style, ...props }) => {
  if (!url) return null;
  return <Image source={{ uri: url }} style={style} {...props} />;
};

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default Cure;
