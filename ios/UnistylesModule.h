#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <string>

#if TARGET_OS_OSX
    #import "Platform_macOS.h"
#elif TARGET_OS_IOS
    #import "Platform_iOS.h"
#endif

@interface UnistylesModule : RCTEventEmitter<RCTBridgeModule>

@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, strong) Platform *platform;

@end
