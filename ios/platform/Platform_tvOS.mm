#if TARGET_OS_TV

#import "Platform_tvOS.h"
#import <React/RCTAppearance.h>

@implementation Platform

- (instancetype)init {
    self = [super init];
    if (self) {
        [self setupListeners];
    }
    return self;
}

- (void)dealloc {
    if (self.unistylesRuntime != nullptr) {
        self.unistylesRuntime = nullptr;
    }

    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: UIContentSizeCategoryDidChangeNotification
                                          object: nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: RCTUserInterfaceStyleDidChangeNotification
                                          object: nil];
}

- (void)setupListeners {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onAppearanceChange:)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onContentSizeCategoryChange:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];
}

- (void)makeShared:(void*)runtime {
    self.unistylesRuntime = runtime;

    auto unistylesRuntime = ((UnistylesRuntime*)self.unistylesRuntime);

    unistylesRuntime->setScreenDimensionsCallback([self](){
        return [self getScreenDimensions];
    });

    unistylesRuntime->setColorSchemeCallback([](){
        return getColorScheme();
    });

    unistylesRuntime->setContentSizeCategoryCallback([](){
        return getContentSizeCategory();
    });

    dispatch_async(dispatch_get_main_queue(), ^{
        Screen screen = [self getScreenDimensions];

        unistylesRuntime->screen = Dimensions({screen.width, screen.height});
        unistylesRuntime->contentSizeCategory = getContentSizeCategory();
        unistylesRuntime->colorScheme = getColorScheme();
        unistylesRuntime->pixelRatio = screen.pixelRatio;
        unistylesRuntime->fontScale = screen.fontScale;
    });
}

- (void)onAppearanceChange:(NSNotification *)notification {
    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleAppearanceChange(getColorScheme());
    }
}

- (void)onContentSizeCategoryChange:(NSNotification *)notification {
    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleContentSizeCategoryChange(getContentSizeCategory());
    }
}

- (Screen)getScreenDimensions {
    UIScreen *screen = [UIScreen mainScreen];
    int width = (int)screen.bounds.size.width;
    int height = (int)screen.bounds.size.height;
    float pixelRatio = screen.scale;
    float fontScale = getFontScale();

    return Screen({width, height, pixelRatio, fontScale});
}

@end

#endif
