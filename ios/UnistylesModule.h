#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

typedef void(^UnistylesEventHandler)(NSDictionary *);
typedef CGFloat(^ScreenWidth)();

@interface UnistylesModule : RCTEventEmitter<RCTBridgeModule>

@end
