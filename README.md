# React Native CMSCure SDK

The official React Native SDK for CMSCure. Integrate a powerful, real-time, and multi-language CMS into your React Native application with ease.

[![NPM Version](https://img.shields.io/npm/v/@cmscure/react-native-cmscure-sdk.svg)](https://www.npmjs.com/package/react-native-cmscure-sdk)
[![License](https://img.shields.io/npm/l/@cmscure/react-native-cmscure-sdk.svg)](https://github.com/cmscure/react-native-cmscure-sdk/blob/main/LICENSE)

## Features

-   **Easy Configuration**: Set up your project in a single step.
-   **Real-time Content**: Content updates automatically in your app via WebSockets.
-   **Localization Made Simple**: Manage multiple languages from your CMS dashboard.
-   **Hooks-based API**: A modern, reactive API using React Hooks (`useCureTranslation`, `useCureColor`, etc.).
-   **Native Performance**: Core logic runs on the native side (Swift/Kotlin) for optimal performance.
-   **Image Caching**: Built-in, automatic image caching with the `<SDKImage />` component, powered by Kingfisher (iOS) and Coil (Android).

## Installation

### Prerequisites

-   **React Native**: >= 0.71
-   **iOS Target**: 13.0 or higher
-   **Android `minSdkVersion`**: 26 or higher (Android 8.0 Oreo)

### Step 1: Add the Package

```bash
npm install @cmscure/react-native-cmscure-sdk
# --- or ---
yarn add @cmscure/react-native-cmscure-sdk
```
You may also need the following peer dependencies for more complex UIs:
```bash
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-linear-gradient @react-native-picker/picker
# --- or ---
yarn add @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-linear-gradient @react-native-picker/picker
```

### Step 2: iOS Configuration (Required)

Because the SDK uses native Swift libraries (Kingfisher, Socket.IO), you must enable framework support in your `ios/Podfile`.

#### 2.1 - Modify `Podfile`

Open your `ios/Podfile` and add `use_frameworks! :linkage => :static` inside your main app target block. This is a **mandatory** step.

```ruby
# In your ios/Podfile

target 'YourAppName' do
  # Add this line. It is required for Swift-based pods to work correctly.
  use_frameworks! :linkage => :static

  config = use_native_modules!

  # ... rest of your Podfile configuration
end
```

#### 2.2 - Create a Bridging Header (If your app uses Swift)

If your project's `AppDelegate` is a `.swift` file, you need a bridging header to make React's Objective-C code available to it. If you already have a file named `YourAppName-Bridging-Header.h`, you can skip to adding the import.

**To create one:**
1.  Open your project's `.xcworkspace` in Xcode.
2.  Go to **File > New > File...**.
3.  Choose **Swift File** and click Next. Name it `Dummy.swift` (you can delete it later).
4.  When Xcode asks **"Would you like to configure an Objective-C bridging header?"**, click **"Create Bridging Header"**.
5.  Xcode will create a file named `YourAppName-Bridging-Header.h`. Open it and add the following import:

    ```c
    // In YourAppName-Bridging-Header.h
    #import <React/RCTBridge.h>
    ```
6.  You can now delete the `Dummy.swift` file.

#### 2.3 - Install Pods

Finally, navigate to your `ios` directory and run `pod install`.

```bash
cd ios
pod install
cd ..
```

### Step 3: Android Configuration

#### 3.1 - Set Minimum SDK Version

The CMSCure SDK requires a minimum Android API level of 26.

1.  Open your project's `android/build.gradle` file.
2.  Ensure the `minSdkVersion` is set to `26` or higher.

    ```groovy
    // In android/build.gradle
    android {
        defaultConfig {
            // ...
            minSdkVersion = 26 // <-- This must be at least 26
            // ...
        }
    }
    ```

#### 3.2 - Install Dependencies
The library should be auto-linked. No further steps are usually required.

## Usage

### 1. Configure the SDK

In your app's entry point file (e.g., `App.js` or `index.js`), import and configure the SDK. This should only be done once.

```javascript
import { Cure } from '@cmscure/react-native-cmscure-sdk';

Cure.configure({
  projectId: 'YOUR_PROJECT_ID',
  apiKey: 'YOUR_API_KEY',
  projectSecret: 'YOUR_PROJECT_SECRET',
});
```

### 2. Using Hooks in Your Components

The best way to use the SDK is with the provided React Hooks. They make your UI reactive to content changes from the CMS.

#### `useCureTranslation`

Fetches a string and updates it automatically.

```javascript
import { useCureTranslation } from '@cmscure/react-native-cmscure-sdk';
import { Text } from 'react-native';

const WelcomeMessage = () => {
  const title = useCureTranslation('home_title', 'home_screen');
  return <Text>{title || 'Loading...'}</Text>;
};
```

#### `useCureColor`

Fetches a color hex string and updates automatically.

```javascript
import { useCureColor } from '@cmscure/react-native-cmscure-sdk';
import { View } from 'react-native';

const ThemedView = ({ children }) => {
  const backgroundColor = useCureColor('primary_background');
  return <View style={{ backgroundColor: backgroundColor || '#FFFFFF' }}>{children}</View>;
};
```

#### `useCureImageURL` and `<SDKImage />`

Fetch a global image URL and display it using the cache-enabled `SDKImage` component.

```javascript
import { useCureImageURL, SDKImage } from '@cmscure/react-native-cmscure-sdk';
import { View, StyleSheet } from 'react-native';

const Logo = () => {
  const logoUrl = useCureImageURL('logo_primary');

  return (
    <View style={styles.container}>
      <SDKImage url={logoUrl} style={styles.logo} resizeMode="contain" />
    </View>
  );
};
```

### 3. Managing Languages

Change the app's language at any time. All `useCure...` hooks will automatically update to reflect the new language.

```javascript
import { Cure } from '@cmscure/react-native-cmscure-sdk';
import { Button } from 'react-native';

const LanguageSwitcher = () => {
  const switchToFrench = () => {
    Cure.setLanguage('fr');
  };

  return <Button title="Switch to French" onPress={switchToFrench} />;
};
```

## API Reference

### `Cure` Object

-   `configure(config)`: Initializes the SDK.
-   `setLanguage(languageCode)`: Sets the active language and triggers a sync.
-   `getLanguage()`: Returns the current language as a `Promise<string>`.
-   `availableLanguages()`: Returns a list of available language codes as a `Promise<string[]>`.
-   `sync(screenName)`: Manually triggers a content sync for a specific screen.
-   `Events`: An object containing constants for real-time update events:
    -   `Cure.Events.COLORS_UPDATED`
    -   `Cure.Events.IMAGES_UPDATED`
    -   `Cure.Events.ALL_SCREENS_UPDATED`

### Hooks

-   `useCureTranslation(key, tab)`: Returns a live string.
-   `useCureColor(key)`: Returns a live color hex string.
-   `useCureImageUrl(key, tab)`: Returns a live URL for a screen-dependent image.
-   `useCureImageURL(assetKey)`: Returns a live URL for a global image asset from the `__images__` tab.

### Components

-   `<SDKImage url={...} />`: A cache-enabled Image component that accepts the same props as the standard React Native `<Image>` component.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
