#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <string>

typedef void(^UnistylesThemeChangeEvent)(std::string);
typedef void(^UnistylesBreakpointChangeEvent)(std::string);

@interface UnistylesModule : RCTEventEmitter<RCTBridgeModule>

@property (nonatomic, assign) void* unistylesRuntime;

@end
