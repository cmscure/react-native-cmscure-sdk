// In ios/CMSCureSDKModule.m

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// This file exposes the Swift class "CMSCureSDKModule" and all its promise-based
// methods to the React Native JavaScript environment.
// Ensure every RCT_EXTERN_METHOD here has a corresponding @objc func in the Swift file.

// The name used here is what you import in JS. Let's rename it to "CMSCureSDK" to match index.js
@interface RCT_EXTERN_MODULE(CMSCureSDKModule, RCTEventEmitter) // Corrected Name

// MARK: - Configuration Methods

RCT_EXTERN_METHOD(configure:(NSString *)projectId
                  apiKey:(NSString *)apiKey
                  projectSecret:(NSString *)projectSecret
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

// This method doesn't exist in your Swift module, remove it or implement it.
// RCT_EXTERN_METHOD(setDebugLogsEnabled:(BOOL)enabled
//                   resolver:(RCTPromiseResolveBlock)resolve
//                   rejecter:(RCTPromiseRejectBlock)reject)

// MARK: - Language Management

RCT_EXTERN_METHOD(setLanguage:(NSString *)languageCode
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

RCT_EXTERN_METHOD(getLanguage:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)   // ADD THIS

RCT_EXTERN_METHOD(availableLanguages:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)         // ADD THIS

// MARK: - Content Fetching

RCT_EXTERN_METHOD(translation:(NSString *)key
                  tab:(NSString *)tab // Corrected parameter name from inTab
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

RCT_EXTERN_METHOD(colorValue:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

// This `imageUrl` method is not in your Swift module, but imageURL is.
// I'll assume you meant to expose the global imageURL.
RCT_EXTERN_METHOD(imageURL:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

// MARK: - Data Store Methods

RCT_EXTERN_METHOD(getStoreItems:(NSString *)apiIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

RCT_EXTERN_METHOD(syncStore:(NSString *)apiIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

// MARK: - Sync & Cache Management

RCT_EXTERN_METHOD(sync:(NSString *)screenName
                  resolver:(RCTPromiseResolveBlock)resolve // ADD THIS
                  rejecter:(RCTPromiseRejectBlock)reject)  // ADD THIS

// This method is in your Swift SDK but not exposed. Expose it if needed.
// RCT_EXTERN_METHOD(clearCache:(RCTPromiseResolveBlock)resolve
//                   rejecter:(RCTPromiseRejectBlock)reject)

@end