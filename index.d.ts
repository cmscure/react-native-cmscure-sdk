import { ReactNode, ComponentProps } from 'react';
import { ImageProps } from 'react-native';

// Core types
export interface CMSCureConfig {
  projectId: string;
  apiKey: string;
  projectSecret?: string; // Only required for iOS
}

export interface JSONValue {
  stringValue?: string;
  intValue?: number;
  doubleValue?: number;
  boolValue?: boolean;
  localizedString?: string;
}

export interface DataStoreItem {
  id: string;
  data: Record<string, JSONValue>;
  createdAt: string;
  updatedAt: string;
}

export interface DataStoreResult {
  items: DataStoreItem[];
  isLoading: boolean;
}

// Main SDK API
export interface CureAPI {
  configure(config: CMSCureConfig): Promise<boolean>;
  setLanguage(languageCode: string): Promise<boolean>;
  getLanguage(): Promise<string>;
  availableLanguages(): Promise<string[]>;
  translation(key: string, tab: string): Promise<string>;
  colorValue(key: string): Promise<string | null>;
  imageURL(key: string): Promise<string | null>;
  getStoreItems(apiIdentifier: string): Promise<DataStoreItem[]>;
  syncStore(apiIdentifier: string): Promise<boolean>;
  sync(screenName: string): Promise<boolean>;
}

export const Cure: CureAPI;

// Provider component
export interface CMSCureProviderProps {
  children: ReactNode;
  config?: CMSCureConfig;
}

export function CMSCureProvider(props: CMSCureProviderProps): JSX.Element;

// Hooks
export function useCureString(
  key: string, 
  tab: string, 
  defaultValue?: string
): string;

export function useCureColor(
  key: string, 
  defaultValue?: string
): string;

export function useCureImage(
  key: string, 
  tab?: string | null
): string | null;

export function useCureDataStore(
  apiIdentifier: string
): DataStoreResult;

// Components
export interface CureSDKImageProps extends Omit<ImageProps, 'source'> {
  url: string | null;
}

export function CureSDKImage(props: CureSDKImageProps): JSX.Element | null;

// Constants that might be useful
export const CMSCureConstants: {
  ALL_SCREENS_UPDATED: string;
  COLORS_UPDATED: string;
  IMAGES_UPDATED: string;
};

// Re-export everything as default
export default Cure;