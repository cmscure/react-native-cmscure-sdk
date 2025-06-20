// index.d.ts

import React from 'react';
import { ImageProps } from 'react-native';

// --- Data Structures ---

/** Represents a single item from a CMSCure Data Store. */
export interface DataStoreItem {
  id: string;
  data: { [key: string]: JSONValue };
  createdAt: string;
  updatedAt: string;
}

/** Represents a dynamic value from a Data Store item's data. */
export interface JSONValue {
  stringValue?: string;
  intValue?: number;
  doubleValue?: number;
  boolValue?: boolean;
  localizedString?: string;
}

// --- Configuration ---

export interface CMSCureConfig {
  projectId: string;
  apiKey: string;
  projectSecret: string;
}

// --- Hooks API (Recommended) ---

/**
 * Provides the CMSCure context to its children. Must be at the root of your app.
 */
export const CMSCureProvider: React.FC<{ children: React.ReactNode }>;

/**
 * A hook that provides a live translation string from the CMS.
 * @param key The translation key.
 * @param tab The tab/screen name where the key is located.
 * @param fallback The default string to display while loading or if the key is not found.
 * @returns The translated string.
 */
export function useCureString(key: string, tab: string, fallback?: string): string;

/**
 * A hook that provides a live color hex string from the CMS.
 * @param key The global color key.
 * @param fallback The default color hex string (e.g., '#FFFFFF').
 * @returns The color hex string.
 */
export function useCureColor(key: string, fallback?: string): string;

/**
 * A hook that provides a live image URL from the CMS.
 * @param key The key for the image asset.
 * @param tab Optional tab/screen name for screen-dependent images. If omitted, fetches from global assets.
 * @returns The image URL string, or null if not found.
 */
export function useCureImage(key: string, tab?: string): string | null;

/**
 * A hook that provides a live, auto-updating list of items from a Data Store.
 * @param apiIdentifier The unique API identifier of the Data Store.
 * @returns An object containing the array of items and a loading state.
 */
export function useCureDataStore(apiIdentifier: string): { items: DataStoreItem[]; isLoading: boolean };

// --- Component API ---

interface CureSDKImageProps extends ImageProps {
  url: string | null;
}

/** A cache-enabled component for displaying images from CMSCure. */
export const CureSDKImage: React.FC<CureSDKImageProps>;

// --- Manual API (for advanced use cases) ---

export const Cure: {
  /**
   * Configures the SDK. Automatically called by the provider.
   */
  configure: (config: CMSCureConfig) => void;
  configure: (config: CMSCureConfig) => Promise;

  /**
   * Sets the active language and triggers a content refresh.
   */
  setLanguage: (languageCode: string) => Promise<void>;

  /**
   * Gets the currently active language code.
   */
  getLanguage: () => Promise<string>;

  /**
   * Fetches the list of available language codes for the project.
   */
  availableLanguages: () => Promise<string[]>;

  /**
   * Manually triggers a sync for a specific Data Store.
   */
  syncStore: (apiIdentifier: string) => Promise<boolean>;

  
  sync: (screenName: string) => Promise<void>;

  /**
   * Fetches a single item from a Data Store by its ID.
   */
  getStoreItems: (apiIdentifier: string) => Promise<DataStoreItem[]>;
  translation: (key: string, tab: string) => Promise<string>;
  colorValue: (key: string) => Promise<string>;
  imageUrl: (key: string, tab: string) => Promise<string>;
  imageURL: (key: string) => Promise<string>;
};