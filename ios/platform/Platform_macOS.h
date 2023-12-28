#include <string>

@interface Platform : NSObject

@property (nonatomic, assign) CGFloat initialWidth;
@property (nonatomic, assign) CGFloat initialHeight;
@property (nonatomic, assign) std::string initialColorScheme;
@property (nonatomic, assign) std::string initialContentSizeCategory;
@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)onWindowResize;
- (void)onAppearanceChange;

- (std::string)getColorScheme;

@end

