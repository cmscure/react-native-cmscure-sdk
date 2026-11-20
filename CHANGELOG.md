# Changelog

All notable changes to `@cmscure/react-native-cmscure-sdk`. Versions follow semver; while the SDK is 0.x, a minor bump (0.2 to 0.3) can change setup steps, a patch never does. Pin an exact version in apps you ship.

## 0.3.0 (2026-11-20)

Added
* Expo config plugin. Add `"@cmscure/react-native-cmscure-sdk"` to `plugins` in app.json and run `expo prebuild`. It sets `ios.useFrameworks` to `static` and keeps the iOS deployment target at 14.0 or higher and Android minSdk at 24 or higher. No Podfile or Gradle edits by hand.
* Web support for react-native-web (Expo web, browser previews). On web the same hooks and `Cure` API run on `@cmscure/javascript-sdk` (pinned to 1.4.8) instead of the native module. Data store items keep the native shape (`id`, `data[field].stringValue`, `localizedString`, `values`, `.string()`, `.double()` and so on).
* Example app for Expo SDK 55 in `example-expo/`.
* CI: unit tests for the web bridge, web export, and Android and iOS release builds of the example on Expo SDK 55 and 58 (New Architecture), started on an emulator and a simulator.
* `addListener` and `removeListeners` on the Android module, so `NativeEventEmitter` no longer warns.
* App key mode: with a per project app key (`cmsc_ck_...`) as `apiKey`, `projectSecret` is optional. iOS and Android then open the live connection with the app key (`sdk:authenticate`), so revoking the key also cuts live updates. With an account API key `projectSecret` is still required and the encrypted handshake is unchanged. On web, app key mode gets live updates too (JS SDK 1.4.8).

Changed
* Android: Jetpack Compose removed from the module build. The module never used Compose, and the Compose compiler settings broke builds on Kotlin 2.x (React Native 0.77 and later, every current Expo SDK). Image prefetch uses plain Coil.
* Android: compileSdk, minSdk and targetSdk follow the host app (`rootProject.ext`) with 35, 24, 35 as defaults. The explicit Kotlin stdlib dependency is gone (the Kotlin Gradle plugin adds it).
* The error for a missing native module now says what to do in Expo (development build, not Expo Go).
* Types: `CMSCureProvider` and `CureSDKImage` return `ReactElement` (the global `JSX` namespace is gone in React 19 types).

Known issues
* Expo SDK 58, iOS: the build stops inside Expo's own `ExpoModulesJSI` (Swift 6 data race error, Xcode 26.3) before this package is built. Target Expo SDK 55 for now. Android on 58 is fine.

Notes
* The SDK only reads published content: strings, colors, image URLs and data store rows. It never runs remote code and cannot write to your project.
* `apiKey` accepts a per project app key (`cmsc_ck_...`, Project settings, API keys), which can be revoked without touching other apps. The account API key keeps working.
* New Architecture: the module runs through React Native's interop layer for legacy modules (on by default since 0.74). CI checks a real release build on Expo SDK 55 (React Native 0.83, New Architecture only).

## 0.2.2 (2026-04-11, tagged in git, not published to npm)
* Fixed a data store loading race.
* Android Compose compiler compatibility fix.

## 0.2.1 (2026-04-11)
* iOS build fixes: `super.init()` order, framework Swift header import, `setLanguage` bridge.

## 0.2.0 (2026-04-11)
* Full rewrite on the current iOS and Android SDKs: hooks API, typed data store accessors, language helpers.

## 0.1.x (2025)
* Data stores (dynamic lists), first public releases.
