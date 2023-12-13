#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <string>

@interface UnistylesModule : RCTEventEmitter<RCTBridgeModule>

@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, assign) void* unistylesRuntime;

@end
