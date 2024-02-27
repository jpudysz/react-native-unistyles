#if TARGET_OS_OSX

#import "Platform_macOS.h"
#import "UnistylesRuntime.h"
#import <React/RCTUtils.h>

@implementation Platform

- (instancetype)init {
    self = [super init];
    if (self) {
        NSWindow *window = RCTSharedApplication().mainWindow;
        
        self.initialScreen = {(int)window.frame.size.width, (int)window.frame.size.height};
        self.initialContentSizeCategory = std::string([@"unspecified" UTF8String]);
        self.initialColorScheme = [self getColorScheme];
        self.initialStatusBar = [self getStatusBarDimensions];
        self.initialNavigationBar = [self getNavigationBarDimensions];
        self.initialInsets = [self getInsets];
        
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

- (void) observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context {
    if ([keyPath isEqualToString:@"effectiveAppearance"]) {
        return [self onAppearanceChange];
    }
    
    if ([keyPath isEqualToString:@"frame"]) {
        return [self onWindowResize];
    }
}

- (void)onAppearanceChange {
    std::string colorScheme = [self getColorScheme];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleAppearanceChange(colorScheme);
    }
}

- (void)onWindowResize {
    NSWindow *window = RCTSharedApplication().mainWindow;
    Dimensions screen = {(int)window.frame.size.width, (int)window.frame.size.height};
    Insets insets = [self getInsets];
    Dimensions statusBar = [self getStatusBarDimensions];
    Dimensions navigationBar = [self getNavigationBarDimensions];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange(
           screen,
           insets,
           statusBar,
           navigationBar
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

- (Insets)getInsets {
    return {0, 0, 0, 0};
}

- (Dimensions)getStatusBarDimensions {
    return {0, 0};
}

- (Dimensions)getNavigationBarDimensions {
    return {0, 0};
}

@end

#endif
