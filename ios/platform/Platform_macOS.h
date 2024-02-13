#include <string>
#include <map>

@interface Platform : NSObject

@property (nonatomic, assign) CGFloat initialWidth;
@property (nonatomic, assign) CGFloat initialHeight;
@property (nonatomic, assign) std::string initialColorScheme;
@property (nonatomic, assign) std::string initialContentSizeCategory;
@property (nonatomic, assign) std::map<std::string, int> initialInsets;
@property (nonatomic, assign) std::map<std::string, int> initialStatusBar;
@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)onWindowResize;
- (void)onAppearanceChange;

- (std::string)getColorScheme;

@end

