#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

typedef void(^UnistylesEventHandler)(NSDictionary *);

@interface UnistylesModule : RCTEventEmitter<RCTBridgeModule>

@property (nonatomic, assign) void* unistylesRuntime;

@end
