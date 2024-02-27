#include <string>
#include <map>
#include <UnistylesRuntime.h>

@interface Platform : NSObject

@property (nonatomic, assign) Dimensions initialScreen;
@property (nonatomic, assign) std::string initialColorScheme;
@property (nonatomic, assign) std::string initialContentSizeCategory;
@property (nonatomic, assign) Insets initialInsets;
@property (nonatomic, assign) Dimensions initialStatusBar;
@property (nonatomic, assign) Dimensions initialNavigationBar;
@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)onWindowResize;
- (void)onAppearanceChange;

- (std::string)getColorScheme;

@end

