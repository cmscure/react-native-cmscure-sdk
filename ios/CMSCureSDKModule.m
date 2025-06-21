//
//  CMSCureSDKModule.m
//  React Native bridge for CMSCureSDK
//

#import "CMSCureSDKModule.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import "CMSCureSDK-Swift.h"  // Auto-generated Swift header

@implementation CMSCureSDKModule

// Expose this module in JS as NativeModules.CMSCureSDK
RCT_EXPORT_MODULE(CMSCureSDK);

#pragma mark - Configuration

RCT_EXPORT_METHOD(configure:(NSString *)projectId
                  apiKey:(NSString *)apiKey
            projectSecret:(NSString *)projectSecret
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [CMSCureSDK.shared configureWithProjectId:projectId
                                       apiKey:apiKey
                                 projectSecret:projectSecret
                                    completion:^(BOOL success) {
      if (success) {
        resolve(@(YES));
      } else {
        reject(@"configure_failed",
               @"CMSCureSDK.configure returned false",
               nil);
      }
    }];
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] configure exception: %@", ex);
    reject(@"configure_exception", ex.reason, nil);
  }
}

#pragma mark - Language Management

RCT_EXPORT_METHOD(setLanguage:(NSString *)languageCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [CMSCureSDK.shared setLanguage:languageCode];
    resolve(@(YES));
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] setLanguage exception: %@", ex);
    reject(@"setLanguage_exception", ex.reason, nil);
  }
}

RCT_EXPORT_METHOD(getLanguage:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *lang = [CMSCureSDK.shared getLanguage];
    resolve(lang ?: @"");
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] getLanguage exception: %@", ex);
    reject(@"getLanguage_exception", ex.reason, nil);
  }
}

RCT_EXPORT_METHOD(availableLanguages:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSArray<NSString *> *langs = [CMSCureSDK.shared availableLanguages];
    resolve(langs);
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] availableLanguages exception: %@", ex);
    reject(@"availableLanguages_exception", ex.reason, nil);
  }
}

#pragma mark - Content Fetching

RCT_EXPORT_METHOD(translation:(NSString *)key
                  tab:(NSString *)tab
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *value = [CMSCureSDK.shared translationForKey:key tab:tab];
    resolve(value ?: @"");
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] translation exception: %@", ex);
    reject(@"translation_exception", ex.reason, nil);
  }
}

RCT_EXPORT_METHOD(colorValue:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *color = [CMSCureSDK.shared colorValueForKey:key];
    resolve(color ?: @"");
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] colorValue exception: %@", ex);
    reject(@"colorValue_exception", ex.reason, nil);
  }
}

RCT_EXPORT_METHOD(imageURL:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSString *url = [CMSCureSDK.shared imageURLForKey:key];
    resolve(url ?: @"");
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] imageURL exception: %@", ex);
    reject(@"imageURL_exception", ex.reason, nil);
  }
}

#pragma mark - Data Store Methods

RCT_EXPORT_METHOD(getStoreItems:(NSString *)apiIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSArray *items = [CMSCureSDK.shared getStoreItemsForIdentifier:apiIdentifier];
    resolve(items);
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] getStoreItems exception: %@", ex);
    reject(@"getStoreItems_exception", ex.reason, nil);
  }
}

RCT_EXPORT_METHOD(syncStore:(NSString *)apiIdentifier
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [CMSCureSDK.shared syncStoreForIdentifier:apiIdentifier completion:^(BOOL success) {
      if (success) {
        resolve(@(YES));
      } else {
        reject(@"syncStore_failed",
               @"CMSCureSDK.syncStore returned false",
               nil);
      }
    }];
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] syncStore exception: %@", ex);
    reject(@"syncStore_exception", ex.reason, nil);
  }
}

#pragma mark - Sync & Cache Management

RCT_EXPORT_METHOD(sync:(NSString *)screenName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    [CMSCureSDK.shared syncForScreen:screenName completion:^(BOOL success) {
      if (success) {
        resolve(@(YES));
      } else {
        reject(@"sync_failed",
               @"CMSCureSDK.sync returned false",
               nil);
      }
    }];
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] sync exception: %@", ex);
    reject(@"sync_exception", ex.reason, nil);
  }
}

#pragma mark - Module Setup

+ (BOOL)requiresMainQueueSetup
{
  // Return YES if your module initialization relies on UIKit.
  return YES;
}

@end