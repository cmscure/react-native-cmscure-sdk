# React Native CMSCure SDK

[![npm version](https://img.shields.io/npm/v/react-native-cmscure-sdk.svg?style=flat)](https://www.npmjs.com/package/react-native-cmscure-sdk)
[![npm downloads](https://img.shields.io/npm/dm/react-native-cmscure-sdk.svg?style=flat)](https://www.npmjs.com/package/react-native-cmscure-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official React Native SDK for integrating with the CMSCure platform. Easily fetch and display dynamic content, translations, colors, and images in your React Native applications, with primary support for real-time updates via WebSockets.

## Features

* Dynamic content fetching (translations, colors, image URLs).
* Multi-language support.
* **Real-time content updates via Socket.IO.**
* In-memory and persistent caching for offline support and performance.
* Easy-to-use API for both iOS and Android.

## Installation

```bash
npm install react-native-cmscure-sdk
# or
yarn add react-native-cmscure-sdk
```

### iOS Installation

After installing the npm package, navigate to your `ios` directory and install the pods:

```bash
cd ios
pod install
cd ..
```

### Android Installation

Autolinking should handle most of the setup. Ensure your project meets the minimum Android SDK requirements (see "Platform Specifics").

## Configuration

Before using any SDK features, you **must** configure it with your project credentials. This is typically done once when your application starts, for example, in your `App.js` or `App.tsx`. The SDK connects to the official CMSCure backend and WebSocket servers.

```javascript
import CMSCureSDK from 'react-native-cmscure-sdk';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        await CMSCureSDK.configure({
          projectId: 'YOUR_PROJECT_ID',       // Replace with your actual Project ID
          apiKey: 'YOUR_API_KEY',             // Replace with your actual API Key
          projectSecret: 'YOUR_PROJECT_SECRET' // Replace with your actual Project Secret
        });
        console.log("CMSCureSDK Configured Successfully!");

        // Start listening for real-time updates (important!)
        await CMSCureSDK.startListening();

        // You can now use other SDK methods
        const currentLang = await CMSCureSDK.getLanguage();
        console.log('Current SDK language:', currentLang);

      } catch (error) {
        console.error("CMSCureSDK Configuration Error:", error);
      }
    };

    initializeSdk();
  }, []);

  // ... your app component
};
```
**Important:** Replace `YOUR_PROJECT_ID`, `YOUR_API_KEY`, and `YOUR_PROJECT_SECRET` with the actual credentials from your CMSCure dashboard.

## API Usage

All API methods return Promises.

### Language Management

* **`CMSCureSDK.setLanguage(languageCode: string, force?: boolean): Promise<void | string>`**
    Sets the active language. `force` (optional, default `false`) forces updates even if the language is the same.
    ```javascript
    await CMSCureSDK.setLanguage('nl'); // Switch to Dutch
    ```

* **`CMSCureSDK.getLanguage(): Promise<string>`**
    Gets the currently active language code.
    ```javascript
    const currentLang = await CMSCureSDK.getLanguage();
    ```

* **`CMSCureSDK.getAvailableLanguages(): Promise<string[]>`**
    Fetches the list of available languages for your project.
    ```javascript
    const languages = await CMSCureSDK.getAvailableLanguages();
    // languages will be an array like ['en', 'nl', 'fr']
    ```

### Content Fetching

* **`CMSCureSDK.translation(key: string, tab: string): Promise<string>`**
    Retrieves a translated string.
    ```javascript
    const welcomeMessage = await CMSCureSDK.translation('welcome_title', 'home_screen');
    ```

* **`CMSCureSDK.colorValue(key: string): Promise<string | null>`**
    Retrieves a color hex string.
    ```javascript
    const primaryColor = await CMSCureSDK.colorValue('primary_theme_color');
    ```

* **`CMSCureSDK.imageUrl(key: string, tab: string): Promise<string | null>`**
    Retrieves an image URL.
    ```javascript
    const logoUrl = await CMSCureSDK.imageUrl('header_logo', 'common_assets');
    ```

### Synchronization & State

* **`CMSCureSDK.sync(screenName: string): Promise<void | string>`**
    Manually triggers a content sync for a specific screen/tab.
    ```javascript
    await CMSCureSDK.sync('profile_screen');
    ```
* **`CMSCureSDK.syncAllTabs(): Promise<void>`**
    Attempts to sync all tabs known to the SDK.

* **`CMSCureSDK.startListening(): Promise<void | string>`**
    Ensures the SDK is listening for real-time updates (e.g., connects the socket if not already connected). It's good practice to call this after `configure`.

* **`CMSCureSDK.isConnected(): Promise<boolean>`**
    Checks if the real-time socket connection is active.

* **`CMSCureSDK.clearCache(): Promise<void | string>`**
    Clears all local cache and persisted SDK data.

* **`CMSCureSDK.setDebugLogsEnabled(enabled: boolean): Promise<void>`**
    Enables or disables verbose native SDK logs.
    ```javascript
    await CMSCureSDK.setDebugLogsEnabled(true);
    ```

### Event Listener for Real-time Updates

Listen for content changes pushed from the CMSCure backend.

```javascript
import { useEffect } from 'react';
import CMSCureSDK from 'react-native-cmscure-sdk';

// Inside your component
useEffect(() => {
  const listener = CMSCureSDK.addContentUpdateListener(event => {
    console.log('CMSCure Content Updated:', event);
    // event.type can be 'ALL_SCREENS_UPDATED', 'COLORS_UPDATED', or 'SCREEN_UPDATED'
    // event.screenName will be present if type is 'SCREEN_UPDATED'
    if (event.type === 'SCREEN_UPDATED' && event.screenName === 'my_current_screen_tab') {
      // refresh content for my_current_screen_tab
    } else if (event.type === 'ALL_SCREENS_UPDATED' || event.type === 'COLORS_UPDATED') {
      // refresh all relevant content
    }
  });

  return () => {
    if (listener) {
      CMSCureSDK.removeContentUpdateListener(listener);
    }
  };
}, []);
```

## Platform Specifics

### Android
* The SDK aims for compatibility with Android API level 21+ (Lollipop), but core features involving encryption and modern network standards (used in `configure`, `setLanguage`, `sync`, `startListening`) perform best and are fully supported on **Android API level 26+ (Oreo)**. On older versions, these methods may be limited or return an error.
* It's recommended to test with various React Native versions. This SDK is tested with `react-native >= 0.71.0`. Newer Xcode versions generally work best with more recent React Native releases.

### iOS
* Requires iOS 11.0 or higher (as per a typical modern Podspec).
* Dependencies (`React-Core`, `Socket.IO-Client-Swift`) are managed by CocoaPods.

## Troubleshooting

* **"The package 'react-native-cmscure-sdk' doesn't seem to be linked"**:
    * Ensure you've run `pod install` in the `ios` directory.
    * Rebuild your app (`npx react-native run-android` or `npx react-native run-ios`).
    * For Android, ensure the package is registered in your `MainApplication.java` or `MainApplication.kt` if autolinking fails.
* **Issues with specific native features**: Enable debug logs (`CMSCureSDK.setDebugLogsEnabled(true);`) and check Logcat (Android) or Console (iOS) for more detailed messages from the native SDK.

## Contributing

(Details for contributions can be added here if the project is open source.)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
