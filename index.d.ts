// index.d.ts
// Place this file in the root of your react-native-cmscure-sdk directory

declare module 'react-native-cmscure-sdk' { // Use the same name as in your package.json

  export interface CMSCureSDKConfigureOptions {
    projectId: string;
    apiKey: string;
    projectSecret: string;
    // serverUrl and socketIOUrl are now hardcoded in the native SDKs
    // pollingIntervalSeconds is removed as polling is deprecated
  }

  export interface ContentUpdateEvent {
    type: 'ALL_SCREENS_UPDATED' | 'COLORS_UPDATED' | 'SCREEN_UPDATED' | 'ERROR';
    screenName?: string; // Present if type is 'SCREEN_UPDATED'
    error?: string;      // Present if type is 'ERROR'
  }

  export interface SDKSubscription {
    remove: () => void;
  }

  const CMSCureSDK: {
    /**
     * Configures the CMSCureSDK with necessary project credentials.
     * Server and Socket URLs are hardcoded.
     * This method MUST be called once, typically early in your application's lifecycle.
     */
    configure: (options: CMSCureSDKConfigureOptions) => Promise<void | string>;

    /**
     * Sets the current active language for retrieving translations.
     * @param languageCode - The language code (e.g., "en", "fr").
     * @param force - If true, forces updates even if the language is the same. Defaults to false.
     */
    setLanguage: (languageCode: string, force?: boolean) => Promise<void | string>;

    /**
     * Retrieves the currently active language code.
     */
    getLanguage: () => Promise<string>;

    /**
     * Fetches the list of available language codes supported by the project.
     */
    getAvailableLanguages: () => Promise<string[]>;

    /**
     * Initiates or ensures the SDK is listening for real-time updates (e.g., socket connection).
     */
    startListening: () => Promise<void | string>;

    /**
     * Retrieves a translation for a specific key and tab.
     * @param key - The translation key.
     * @param tab - The tab/screen name.
     * @returns The translated string, or an empty string if not found.
     */
    translation: (key: string, tab: string) => Promise<string>;

    /**
     * Retrieves a color hex string for a given key.
     * @param key - The color key.
     * @returns The color hex string (e.g., "#RRGGBB"), or null if not found.
     */
    colorValue: (key: string) => Promise<string | null>;

    /**
     * Retrieves an image URL for a given key and tab.
     * @param key - The image URL key.
     * @param tab - The tab/screen name.
     * @returns The image URL string, or null if not found or invalid.
     */
    imageUrl: (key: string, tab: string) => Promise<string | null>;

    /**
     * Fetches the latest content for a specific screen/tab.
     * @param screenName - The name of the screen/tab.
     */
    sync: (screenName: string) => Promise<void | string>;

    /**
     * Checks if the SDK's Socket.IO client is connected and handshake is acknowledged.
     */
    isConnected: () => Promise<boolean>;

    /**
     * Enables or disables verbose debug logging in the native SDKs.
     * @param enabled - True to enable logs, false to disable.
     */
    setDebugLogsEnabled: (enabled: boolean) => Promise<void>;

    /**
     * Clears all cached data, persisted files, and resets relevant SDK state.
     * The SDK may require re-configuration after calling this method.
     */
    clearCache: () => Promise<void | string>;

    /**
     * Retrieves the list of known project tabs/screens from the native SDK.
     */
    getKnownTabs: () => Promise<string[] | undefined>;

    /**
     * Attempts to sync content for all tabs currently known to the SDK.
     */
    syncAllTabs: () => Promise<void>;

    /**
     * Adds a listener for CMSCure content update events.
     * @param listener - A callback function that receives event objects.
     * @returns A subscription object with a `remove()` method to unsubscribe.
     */
    addContentUpdateListener: (listener: (event: ContentUpdateEvent) => void) => SDKSubscription | undefined;

    /**
     * Removes a previously added content update listener.
     * @param subscription - The subscription object returned by `addContentUpdateListener`.
     */
    removeContentUpdateListener: (subscription?: SDKSubscription) => void;

    /**
     * Removes all listeners for the 'CMSCureContentUpdated' event. Use with caution.
     */
    removeAllContentUpdateListeners: () => void;
  };

  export default CMSCureSDK;
}
