#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h> // Import the EventEmitter header

// Inherit from RCTEventEmitter instead of NSObject
@interface CMSCureSDKModule : RCTEventEmitter <RCTBridgeModule>

@end