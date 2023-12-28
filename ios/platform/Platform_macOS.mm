#if TARGET_OS_OSX

#import "Platform_macOS.h"
#import "UnistylesRuntime.h"
#import <React/RCTUtils.h>

@implementation Platform

- (instancetype)init {
    self = [super init];
    if (self) {
        NSWindow *window = RCTSharedApplication().mainWindow;
        
        self.initialWidth = window.frame.size.width;
        self.initialHeight = window.frame.size.height;
        self.initialContentSizeCategory = std::string([@"unspecified" UTF8String]);
        self.initialColorScheme = [self getColorScheme];
        
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
    
    CGFloat screenWidth = window.frame.size.width;
    CGFloat screenHeight  = window.frame.size.height;

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange((int)screenWidth, (int)screenHeight);
    }
}

- (std::string)getColorScheme {
    NSAppearance *appearance = RCTSharedApplication().effectiveAppearance;

    if (appearance.name == NSAppearanceNameDarkAqua) {
        return UnistylesDarkScheme;
    }
    
    return UnistylesLightScheme;
}

@end

#endif
