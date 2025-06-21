#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "React/RCTBridgeModule.h"
#import "CMSCureSDKModule.h"

@interface RCT_EXPORT_MODULE(CMSCureSDKModule, NSObject)

// MARK: - Configuration Methods

RCT_EXPORT_METHOD(configure:(NSString *)projectId
                  apiKey:(NSString *)apiKey
                  projectSecret:(NSString *)projectSecret
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// MARK: - Language Management

RCT_EXPORT_METHOD(setLanguage:(NSString *)languageCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(getLanguage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(availableLanguages:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// MARK: - Content Fetching

RCT_EXPORT_METHOD(translation:(NSString *)key
                  tab:(NSString *)tab
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(colorValue:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(imageURL:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// MARK: - Data Store Methods

RCT_EXPORT_METHOD(getStoreItems:(NSString *)apiIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(syncStore:(NSString *)apiIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// MARK: - Sync & Cache Management

RCT_EXPORT_METHOD(sync:(NSString *)screenName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

@end