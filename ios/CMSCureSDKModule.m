// Enhanced CMSCureSDKModule.m with better DataStore support

#import "CMSCureSDKModule.h"
#import <React/RCTLog.h>
#import "react_native_cmscure_sdk-Swift.h"

@implementation CMSCureSDKModule
{
  BOOL hasListeners;
}

RCT_EXPORT_MODULE(CMSCureSDK);

- (instancetype)init {
    if (self = [super init]) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleContentUpdate:)
                                                     name:@"CMSCureTranslationsUpdatedNotification"
                                                   object:nil];
    }
    return self;
}

- (void)handleContentUpdate:(NSNotification *)notification {
  if (hasListeners) {
    NSDictionary *userInfo = notification.userInfo;
    NSString *screenName = userInfo[@"screenName"];
    NSString *providedUpdateType = userInfo[@"updateType"];
    
    // Use the provided update type from the notification, or determine it
    NSString *updateType = providedUpdateType;
    if (!updateType) {
        updateType = @"translation"; // default
        if ([screenName containsString:@"store"]) {
            updateType = @"dataStore";
        } else if ([screenName isEqualToString:@"__colors__"]) {
            updateType = @"colors";
        } else if ([screenName isEqualToString:@"__images__"]) {
            updateType = @"images";
        } else if ([screenName isEqualToString:@"__ALL_SCREENS_UPDATED__"]) {
            updateType = @"all";
        }
    }
    
    [self sendEventWithName:@"CMSCureContentUpdate" body:@{
        @"type": updateType,
        @"identifier": screenName ?: @""
    }];
  }
}

RCT_EXPORT_METHOD(configure:(NSString *)projectId
                   apiKey:(NSString *)apiKey
           projectSecret:(NSString *)projectSecret
                resolver:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject) {
  [[CMSCureSDK shared] configureWithProjectId:projectId apiKey:apiKey projectSecret:projectSecret];
  resolve(@(YES));
}

RCT_EXPORT_METHOD(setLanguage:(NSString *)languageCode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[CMSCureSDK shared] setLanguage:languageCode];
  resolve(@(YES));
}

RCT_EXPORT_METHOD(getLanguage:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *lang = [[CMSCureSDK shared] getLanguage];
  resolve(lang ?: @"");
}

RCT_EXPORT_METHOD(availableLanguages:(RCTPromiseResolveBlock)resolve
                             rejecter:(RCTPromiseRejectBlock)reject) {
  [[CMSCureSDK shared] availableLanguagesWithCompletion:^(NSArray<NSString *> * languages) {
    resolve(languages ?: @[]);
  }];
}

RCT_EXPORT_METHOD(translation:(NSString *)key
                          tab:(NSString *)tab
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *value = [[CMSCureSDK shared] translationFor:key inTab:tab];
  resolve(value ?: @"");
}

RCT_EXPORT_METHOD(colorValue:(NSString *)key
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *color = [[CMSCureSDK shared] colorValueFor:key];
  resolve(color ?: @"");
}

RCT_EXPORT_METHOD(imageURL:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSURL *url = [[CMSCureSDK shared] imageURLForKey:key];
  resolve(url ? url.absoluteString : @"");
}

RCT_EXPORT_METHOD(getStoreItems:(NSString *)apiIdentifier
                        resolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject)
{
  @try {
    NSArray *items = [[CMSCureSDK shared] getStoreItemsForObjC:apiIdentifier];
    resolve(items ?: @[]);
  }
  @catch (NSException *ex) {
    RCTLogError(@"[CMSCureSDK] getStoreItems exception: %@", ex);
    reject(@"getStoreItems_exception", ex.reason ?: @"Unknown error", nil);
  }
}

RCT_EXPORT_METHOD(syncStore:(NSString *)apiIdentifier
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject) {
  [[CMSCureSDK shared] syncStoreWithApiIdentifier:apiIdentifier completion:^(BOOL success, NSArray *items) {
    if (success) {
      resolve(items ?: @[]);
    } else {
      reject(@"sync_store_failed", @"Failed to sync data store on iOS", nil);
    }
  }];
}

RCT_EXPORT_METHOD(sync:(NSString *)screenName
               resolver:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject) {
  [[CMSCureSDK shared] syncWithScreenName:screenName completion:^(BOOL success) {
    resolve(@(success));
  }];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"CMSCureContentUpdate"];
}

- (void)startObserving {
    hasListeners = YES;
}

- (void)stopObserving {
    hasListeners = NO;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
