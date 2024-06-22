#include <string>
#include <map>
#include <UnistylesRuntime.h>

@interface Platform : NSObject

@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)makeShared:(void*)runtime;
- (void)onWindowChange;
- (void)onAppearanceChange;

- (std::string)getColorScheme;

@end

