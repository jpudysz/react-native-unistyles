#include <string>

@interface Platform : NSObject

@property (nonatomic, assign) CGFloat initialWidth;
@property (nonatomic, assign) CGFloat initialHeight;
@property (nonatomic, assign) std::string initialColorScheme;
@property (nonatomic, assign) std::string initialContentSizeCategory;
@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)onOrientationChange:(NSNotification *)notification;
- (void)onAppearanceChange:(NSNotification *)notification;
- (void)onContentSizeCategoryChange:(NSNotification *)notification;

- (std::string)getColorScheme;
- (std::string)getContentSizeCategory:(UIContentSizeCategory)contentSizeCategory;

@end
