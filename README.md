# React Native CMSCure SDK

[![NPM Version](https://img.shields.io/npm/v/@cmscure/react-native-cmscure-sdk.svg)](https://www.npmjs.com/package/@cmscure/react-native-cmscure-sdk)
[![License](https://img.shields.io/npm/l/@cmscure/react-native-cmscure-sdk.svg)](https://github.com/cmscure/react-native-cmscure-sdk/blob/main/LICENSE)

The official React Native SDK for [CMSCure](https://cmscure.com) — deliver translations, colors, images, and structured data to your React Native app with real-time updates out of the box.

## Features

| Feature | Details |
|---|---|
| **Live Content** | Translations, colors, global images, and data stores |
| **Real-time Updates** | Content updates automatically via WebSockets — no polling |
| **Hooks-based API** | Reactive hooks (`useCureString`, `useCureColor`, `useCureImage`, `useCureDataStore`, `useCureLanguage`) |
| **Data Stores** | Typed access via `.string()`, `.double()`, `.int()`, `.bool()`, `.ctaURL` convenience accessors |
| **RTL / LTR Support** | `LanguageDirection` utility with automatic detection for 11+ RTL languages |
| **Language Display** | `CureLanguageDisplay` with flag emojis and display names for 80+ languages |
| **Native Performance** | Core logic runs on Swift (iOS) and Kotlin (Android) for optimal performance |
| **Image Caching** | Built-in caching powered by Kingfisher (iOS) and Coil (Android) |
| **Cross-platform API** | Naming conventions align with the native iOS and Android SDKs |

## Requirements

| Requirement | Minimum |
|---|---|
| React Native | 0.71+ (New Architecture supported) |
| Expo | Development build; tested on SDK 55 and 58 |
| iOS Target | 14.0+ |
| Android API | 24+ |

---

## Installation

### Step 1: Add the Package

```bash
npm install @cmscure/react-native-cmscure-sdk
# --- or ---
yarn add @cmscure/react-native-cmscure-sdk
```

### Expo (recommended for new apps)

The package ships an Expo config plugin, so no Podfile or Gradle edits are needed:

```bash
npx expo install @cmscure/react-native-cmscure-sdk
```

```json
{
  "expo": {
    "plugins": ["@cmscure/react-native-cmscure-sdk"]
  }
}
```

Then run `npx expo prebuild` (or build with EAS). The plugin sets `ios.useFrameworks` to `static` and makes sure the iOS deployment target is at least 14.0 and Android minSdk at least 24. If your app already sets `ios.useFrameworks` through `expo-build-properties`, keep it at `static`; to stop the plugin from touching it use `["@cmscure/react-native-cmscure-sdk", { "ios": { "useFrameworks": false } }]`.

**Known issue:** on Expo SDK 58 the iOS build currently stops inside Expo's own `ExpoModulesJSI` (Swift 6 data race error with Xcode 26.3), before this package is built. Use Expo SDK 55 for now; Android on 58 builds and runs.

This is a native module, so it does not run in Expo Go. Use a development build (`npx expo run:ios`, `npx expo run:android` or `eas build --profile development`). Tested on Expo SDK 55 and 58 with the New Architecture, see [`example-expo/`](example-expo/).

### Web (react-native-web)

On web the package uses `@cmscure/javascript-sdk` under the hood (installed with it), so the same hooks and `Cure` calls work in Expo web and browser previews. Nothing to configure.

### Bare React Native

Steps 2 and 3 below are only for apps without Expo prebuild.

### Step 2: iOS Configuration (Required)

Because the SDK uses native Swift libraries (Kingfisher, Socket.IO), you must enable framework support in your `ios/Podfile`.

#### 2.1 — Modify `Podfile`

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

#### 2.2 — Create a Bridging Header (If your app uses Swift)

If your project's `AppDelegate` is a `.swift` file, you need a bridging header to make React's Objective-C code available to it. If you already have a file named `YourAppName-Bridging-Header.h`, you can skip to adding the import.

**To create one:**
1. Open your project's `.xcworkspace` in Xcode.
2. Go to **File → New → File…**.
3. Choose **Swift File** and click Next. Name it `Dummy.swift` (you can delete it later).
4. When Xcode asks **"Would you like to configure an Objective-C bridging header?"**, click **"Create Bridging Header"**.
5. Xcode will create a file named `YourAppName-Bridging-Header.h`. Open it and add the following import:

    ```c
    // In YourAppName-Bridging-Header.h
    #import <React/RCTBridge.h>
    ```
6. You can now delete the `Dummy.swift` file.

#### 2.3 — Install Pods

```bash
cd ios
pod install
cd ..
```

### Step 3: Android Configuration

#### 3.1 — Set Minimum SDK Version

The CMSCure SDK requires a minimum Android API level of 24.

1. Open your project's `android/build.gradle` file.
2. Ensure the `minSdkVersion` is set to `24` or higher.

    ```groovy
    // In android/build.gradle
    android {
        defaultConfig {
            minSdkVersion = 24 // <-- This must be at least 24
        }
    }
    ```

#### 3.2 — Install Dependencies

The library is auto-linked. No further steps are usually required.

---

## Quick Start

### 1. Create Content in the CMSCure Dashboard

Create a new project and add the following content. These keys and values are used by the two example files in the [`examples/`](examples/) folder ([Basic](examples/BasicExample.js) and [Advanced](examples/AdvancedExample.js)), so adding them lets you run the examples immediately:

| Type | Screen / Store | Key | Sample Value |
|------|---------------|-----|-------------|
| Translation | `home_screen` | `welcome_title` | Welcome! |
| Translation | `home_screen` | `welcome_subtitle` | Manage content, your way. |
| Translation | `home_screen` | `cta_button` | Get Started |
| Color | — | `primary_color` | #007AFF |
| Color | — | `accent_color` | #FF9500 |
| Color | — | `background_color` | #F2F2F7 |
| Image | — | `app_logo` | *(upload your logo)* |
| Image | — | `hero_banner` | *(upload a banner)* |
| Data Store | `feature_products` | — | Store Name: **Feature Products**, Fields: `title` (String), `price` (Number), `image_url` (String) |

### 2. Configure with CMSCureProvider

Wrap your app in `CMSCureProvider` — it initializes the SDK, syncs colors and images, and provides context to all hooks.

```javascript
import { CMSCureProvider } from '@cmscure/react-native-cmscure-sdk';

const cmsConfig = {
  projectId: 'YOUR_PROJECT_ID',       // ← replace
  apiKey: 'YOUR_API_KEY',             // ← replace
  projectSecret: 'YOUR_PROJECT_SECRET', // ← replace
};

export default function App() {
  return (
    <CMSCureProvider config={cmsConfig}>
      <HomeScreen />
    </CMSCureProvider>
  );
}
```

> **Replace** `YOUR_PROJECT_ID`, `YOUR_API_KEY`, and `YOUR_PROJECT_SECRET` with the credentials from your CMSCure dashboard.

#### Keys in your app

* For `apiKey`, prefer a per project **app key** (starts with `cmsc_ck_`). Create it in the dashboard under Project settings, API keys. It can only read that one project and you can revoke it at any time without breaking your other apps. Your account API key keeps working too.
* With an app key, `projectSecret` is optional: leave it out and the real time connection signs in with the app key.
* Anything inside an app binary can be extracted, which is fine here: the SDK keys can only read published content. `projectSecret` only encrypts the real time connection.

#### The SDK only reads data

The SDK downloads strings, translations, colors, image URLs and data store rows. It never runs remote code, never builds screens from a remote layout and cannot write to your project. Content you publish reaches apps that are already in the App Store and Google Play, so use it for content. Switching on features the store review never saw, or changing what the app does, needs a new store release.

---

## Hooks

All hooks must be used inside a `CMSCureProvider`. They automatically re-render when CMS content changes in real time.

### `useCureString`

Reactive CMS translation string.

```javascript
import { useCureString } from '@cmscure/react-native-cmscure-sdk';

const title = useCureString('welcome_title', 'home_screen', 'Welcome!');
//                           key              tab            default
```

### `useCureColor`

Reactive CMS color hex string.

```javascript
import { useCureColor } from '@cmscure/react-native-cmscure-sdk';

const primaryColor = useCureColor('primary_color', '#007AFF');
//                                 key              default
```

### `useCureImage`

Reactive CMS image URL. Pass `tab` for translation-based images, omit for global images.

```javascript
import { useCureImage, CureSDKImage } from '@cmscure/react-native-cmscure-sdk';

const heroUrl = useCureImage('hero_banner');
// <CureSDKImage url={heroUrl} style={{ width: '100%', height: 200 }} resizeMode="cover" />
```

### `useCureDataStore`

Reactive CMS data store. Returns `{ items, isLoading }` where each item has typed convenience accessors.

```javascript
import { useCureDataStore } from '@cmscure/react-native-cmscure-sdk';

const { items: products, isLoading } = useCureDataStore('feature_products');

products.forEach((item) => {
  const name  = item.string('title');      // localized string
  const price = item.double('price');      // number or null
  const cta   = item.ctaURL;              // CTA URL from "cta_url" field
});
```

### `useCureLanguage`

Returns the current language code, RTL flag, flag emoji, and display name. Re-renders on language changes.

```javascript
import { useCureLanguage } from '@cmscure/react-native-cmscure-sdk';

const lang = useCureLanguage();
// lang.code        → "ar"
// lang.isRTL       → true
// lang.flag        → "🇸🇦"
// lang.displayName → "Arabic"
```

---

## Core API

The `Cure` object provides imperative access to all SDK functions. Use it outside of hooks or for manual control.

```javascript
import { Cure } from '@cmscure/react-native-cmscure-sdk';
```

### Translations

```javascript
const title = await Cure.translation('welcome_title', 'home_screen');
```

### Colors

```javascript
const hex = await Cure.colorValue('primary_color'); // "#007AFF"
```

### Images

```javascript
const url = await Cure.imageURL('hero_banner');
```

### Data Stores

```javascript
const items = await Cure.getStoreItems('feature_products');

items.forEach((item) => {
  console.log(item.string('title'));   // localized string
  console.log(item.double('price'));   // number
  console.log(item.bool('is_active')); // boolean
  console.log(item.ctaURL);           // CTA URL or null
});

// Or sync from server first:
const freshItems = await Cure.syncStore('feature_products');
```

### Manual Sync

```javascript
await Cure.sync('home_screen');
```

---

## Language Management

```javascript
// Set language — all hooks re-render automatically
await Cure.setLanguage('fr');

// Get current language
const code = await Cure.getLanguage(); // "fr"

// List available languages
const languages = await Cure.availableLanguages(); // ["en", "fr", "ar"]
```

### Language Direction (RTL / LTR)

The SDK includes a pure-JS `LanguageDirection` utility for layout handling:

```javascript
import { LanguageDirection } from '@cmscure/react-native-cmscure-sdk';

LanguageDirection.direction('ar'); // "RTL"
LanguageDirection.direction('en'); // "LTR"
LanguageDirection.isRTL('he');     // true
```

Supported RTL languages: `ar`, `he`, `fa`, `ur`, `ps`, `sd`, `ku`, `yi`, `ckb`, `dv`, `ug`.

### Language Display Helpers

Built-in flag emojis and display names for 80+ languages. No need to maintain your own mappings:

```javascript
import { CureLanguageDisplay } from '@cmscure/react-native-cmscure-sdk';

CureLanguageDisplay.flag('ar');          // "🇸🇦"
CureLanguageDisplay.flag('pt-br');       // "🇧🇷"
CureLanguageDisplay.displayName('fr');   // "French"
CureLanguageDisplay.displayName('zh-tw'); // "Chinese (Traditional)"
```

---

## Components

### `<CureSDKImage />`

Renders a CMS-managed image from a URL. Returns `null` when the URL is falsy. Accepts all standard React Native `<Image>` props.

```javascript
import { CureSDKImage, useCureImage } from '@cmscure/react-native-cmscure-sdk';

const logoUrl = useCureImage('app_logo');

<CureSDKImage url={logoUrl} style={{ width: 60, height: 60 }} resizeMode="contain" />
```

---

## Constants

```javascript
import { CMSCureConstants } from '@cmscure/react-native-cmscure-sdk';

CMSCureConstants.ALL_SCREENS_UPDATED // "__ALL_SCREENS_UPDATED__"
CMSCureConstants.COLORS_UPDATED      // "__colors__"
CMSCureConstants.IMAGES_UPDATED      // "__images__"
```

---

## iOS / Android / React Native API Parity

| iOS | Android | React Native | Notes |
|---|---|---|---|
| `Cure.shared.configure(...)` | `Cure.configure(...)` | `Cure.configure({...})` | Provider handles this |
| `CureString(key, tab:)` | `rememberCureString(key, tab)` | `useCureString(key, tab)` | Reactive hook |
| `CureColor(key)` | `rememberCureColor(key)` | `useCureColor(key)` | Returns hex string |
| `Cure.shared.imageURL(forKey:)` | `Cure.imageURL(forKey:)` | `useCureImage(key)` | Returns URL string |
| `CureDataStore(apiIdentifier:)` | `cureDataStore(id)` | `useCureDataStore(id)` | `{ items, isLoading }` |
| `item.string("key")` | `item.string("key")` | `item.string("key")` | Same typed accessors |
| `item.double("key")` | `item.double("key")` | `item.double("key")` | Same typed accessors |
| `item.ctaURL` | `item.ctaURL` | `item.ctaURL` | Same property |
| `CureLanguageDisplay.flag(for:)` | `CureLanguageDisplay.flag(code)` | `CureLanguageDisplay.flag(code)` | Flag emoji |
| `LanguageDirection.direction(for:)` | `LanguageDirection.direction(code)` | `LanguageDirection.direction(code)` | `"RTL"` / `"LTR"` |

---

## Examples

Complete working examples are in the [`examples/`](examples/) folder:

| Example | Description |
|---------|-------------|
| [`BasicExample.js`](examples/BasicExample.js) | Full app with `CMSCureProvider`, all hooks, data store with typed accessors, and language picker with RTL badge |
| [`AdvancedExample.js`](examples/AdvancedExample.js) | Imperative `Cure.*` API, manual sync, real-time event listeners, and standalone utilities |

Both examples use the keys from the Quick Start table above.

---

## Troubleshooting

- **Hooks not working?** Make sure your component is inside `<CMSCureProvider>`.
- **Expo: "CMSCureSDK native module is not available"?** You are in Expo Go. Add the plugin and use a development build.
- **iOS build fails?** Ensure `use_frameworks! :linkage => :static` is in your `Podfile` (Expo: the plugin does this) and you ran `pod install`.
- **Android build fails?** Ensure `minSdkVersion` is at least `24`.
- **Content not updating?** Check that `enableAutoRealTimeUpdates` is `true` (default) in your config.

## License

MIT — see [LICENSE](LICENSE).
