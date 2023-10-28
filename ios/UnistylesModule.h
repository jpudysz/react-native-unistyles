#import <React/RCTBridgeModule.h>

@interface UnistylesModule : NSObject <RCTBridgeModule>

@property (nonatomic, strong) NSDictionary *breakpoints;
@property (nonatomic, strong) NSArray *sortedBreakpointEntries;

@end
