#if TARGET_OS_OSX

#import "Platform_macOS.h"
#import <React/RCTUtils.h>

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

    NSWindow *window = RCTSharedApplication().mainWindow;

    [window removeObserver:self forKeyPath:@"effectiveAppearance"];
    [window removeObserver:self forKeyPath:@"frame"];
}

- (void)setupListeners {
    NSWindow *window = RCTSharedApplication().mainWindow;

    [window addObserver:self forKeyPath:@"effectiveAppearance" options:NSKeyValueObservingOptionNew context:nil];
    [window addObserver:self forKeyPath:@"frame" options:NSKeyValueObservingOptionNew context:nil];
}

- (void)makeShared:(void*)runtime {
    self.unistylesRuntime = runtime;
    
    auto unistylesRuntime = ((UnistylesRuntime*)self.unistylesRuntime);
    
    unistylesRuntime->setScreenDimensionsCallback([self](){
        return [self getScreenDimensions];
    });
    
    unistylesRuntime->setColorSchemeCallback([self](){
        return [self getColorScheme];
    });
    
    dispatch_async(dispatch_get_main_queue(), ^{
        Screen screen = [self getScreenDimensions];
        
        unistylesRuntime->screen = Dimensions({screen.width, screen.height});
        unistylesRuntime->colorScheme = [self getColorScheme];
        unistylesRuntime->fontScale = screen.fontScale;
        unistylesRuntime->pixelRatio = screen.pixelRatio;
    });
}

- (void) observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context {
    if ([keyPath isEqualToString:@"effectiveAppearance"]) {
        return [self onAppearanceChange];
    }

    if ([keyPath isEqualToString:@"frame"]) {
        return [self onWindowChange];
    }
}

- (void)onAppearanceChange {
    std::string colorScheme = [self getColorScheme];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleAppearanceChange(colorScheme);
    }
}

- (void)onWindowChange {
    Screen screen = [self getScreenDimensions];
    
    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange(
           screen,
           std::nullopt,
           std::nullopt,
           std::nullopt
        );
    }
}

- (std::string)getColorScheme {
    NSAppearance *appearance = RCTSharedApplication().effectiveAppearance;

    if (appearance.name == NSAppearanceNameDarkAqua) {
        return UnistylesDarkScheme;
    }

    return UnistylesLightScheme;
}

- (Screen)getScreenDimensions {
    NSWindow *window = RCTSharedApplication().mainWindow;
    int width = (int)window.frame.size.width;
    int height = (int)window.frame.size.height;
    float pixelRatio = window.backingScaleFactor;
    float fontScale = [self getFontScale];
    
    return Screen({width, height, pixelRatio, fontScale});
}

- (float)getFontScale {
    NSFont *systemFont = [NSFont systemFontOfSize:[NSFont systemFontSize]];
    CGFloat systemFontScale = systemFont.pointSize / 13.0;
    
    return systemFontScale;
}

@end

#endif
