import { ReactElement, ReactNode } from 'react';
import { ImageProps } from 'react-native';

// ---------------------------------------------------------------------------
// Core configuration
// ---------------------------------------------------------------------------

export interface CMSCureConfig {
  projectId: string;
  apiKey: string;
  projectSecret: string;
  enableAutoRealTimeUpdates?: boolean;
}

// ---------------------------------------------------------------------------
// Data Store types
// ---------------------------------------------------------------------------

export interface JSONValue {
  stringValue?: string;
  intValue?: number;
  doubleValue?: number;
  boolValue?: boolean;
  localizedString?: string;
  values?: Record<string, string>;
}

/** A single record from a CMS data store with typed convenience accessors. */
export interface DataStoreItem {
  id: string;
  data: Record<string, JSONValue>;
  createdAt: string;
  updatedAt: string;
  /** CTA / deep-link URL if a `cta_url` field exists and is non-empty. */
  readonly ctaURL: string | null;
  /** Returns the localised/string value for a key, or null. */
  string(key: string): string | null;
  /** Returns the integer value for a key, or null. */
  int(key: string): number | null;
  /** Returns the double/float value for a key, or null. */
  double(key: string): number | null;
  /** Returns the boolean value for a key, or null. */
  bool(key: string): boolean | null;
}

export interface DataStoreResult {
  items: DataStoreItem[];
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Language utilities
// ---------------------------------------------------------------------------

export interface LanguageDirectionAPI {
  /** Returns `'RTL'` or `'LTR'` for a given BCP-47 language code. */
  direction(code: string): 'RTL' | 'LTR';
  /** Returns `true` when the language is right-to-left. */
  isRTL(code: string): boolean;
}

export const LanguageDirection: LanguageDirectionAPI;

export interface CureLanguageDisplayAPI {
  /** Returns the flag emoji for a language code (e.g. `'🇺🇸'` for `'en'`). */
  flag(code: string): string;
  /** Returns a human-readable display name (e.g. `'English'` for `'en'`). */
  displayName(code: string): string;
}

export const CureLanguageDisplay: CureLanguageDisplayAPI;

// ---------------------------------------------------------------------------
// Core SDK API
// ---------------------------------------------------------------------------

export interface CureAPI {
  configure(config: CMSCureConfig): Promise<boolean>;
  setLanguage(languageCode: string): Promise<boolean>;
  getLanguage(): Promise<string>;
  availableLanguages(): Promise<string[]>;
  translation(key: string, tab: string): Promise<string>;
  colorValue(key: string): Promise<string | null>;
  imageURL(key: string): Promise<string | null>;
  /** Returns data store items with typed convenience accessors. */
  getStoreItems(apiIdentifier: string): Promise<DataStoreItem[]>;
  /** Syncs a data store from the server and returns items with typed convenience accessors. */
  syncStore(apiIdentifier: string): Promise<DataStoreItem[]>;
  sync(screenName: string): Promise<boolean>;
}

export const Cure: CureAPI;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CMSCureConstants: {
  ALL_SCREENS_UPDATED: string;
  COLORS_UPDATED: string;
  IMAGES_UPDATED: string;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface CMSCureProviderProps {
  children: ReactNode;
  config?: CMSCureConfig;
}

export function CMSCureProvider(props: CMSCureProviderProps): ReactElement;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Reactive CMS translation string. Auto-updates on content changes. */
export function useCureString(
  key: string,
  tab: string,
  defaultValue?: string,
): string;

/** Reactive CMS color hex string. Auto-updates on content changes. */
export function useCureColor(
  key: string,
  defaultValue?: string,
): string;

/** Reactive CMS image URL. Pass `tab` for translation-based images, omit for global images. */
export function useCureImage(
  key: string,
  tab?: string | null,
): string | null;

/** Reactive CMS data store. Returns `{ items, isLoading }` where each item has typed accessors. */
export function useCureDataStore(
  apiIdentifier: string,
): DataStoreResult;

export interface CureLanguageState {
  code: string;
  isRTL: boolean;
  flag: string;
  displayName: string;
}

/** Returns the current language code, RTL flag, flag emoji, and display name. Re-renders on language changes. */
export function useCureLanguage(): CureLanguageState;

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export interface CureSDKImageProps extends Omit<ImageProps, 'source'> {
  url: string | null;
}

/** Renders a CMS-managed image from a URL. Returns null when url is falsy. */
export function CureSDKImage(props: CureSDKImageProps): ReactElement | null;

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default Cure;
