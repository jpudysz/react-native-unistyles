#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface UnistylesModule : RCTEventEmitter<RCTBridgeModule>

@property (nonatomic, strong) NSDictionary *breakpoints;
@property (nonatomic, strong) NSArray *sortedBreakpointEntries;
@property (nonatomic, strong) NSMutableArray<NSString *> *themes;
@property (nonatomic, strong) NSString *currentTheme;

@end
