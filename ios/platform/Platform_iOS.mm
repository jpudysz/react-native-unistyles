#if TARGET_OS_IOS

#import "Platform_iOS.h"
#import "UnistylesRuntime.h"
#import <React/RCTAppearance.h>

@implementation Platform

- (instancetype)init {
    self = [super init];
    if (self) {
        UIScreen *screen = [UIScreen mainScreen];
        UIContentSizeCategory contentSizeCategory = [[UIApplication sharedApplication] preferredContentSizeCategory];

        self.initialScreen = {(int)screen.bounds.size.width, (int)screen.bounds.size.height};
        self.initialColorScheme = [self getColorScheme];
        self.initialContentSizeCategory = [self getContentSizeCategory:contentSizeCategory];
        self.initialStatusBar = [self getStatusBarDimensions];
        self.initialInsets = [self getInsets];
        
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
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: UIDeviceOrientationDidChangeNotification
                                          object: nil];
}

- (void)setupListeners {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onOrientationChange:)
                                                 name:UIDeviceOrientationDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onAppearanceChange:)
                                                 name:RCTUserInterfaceStyleDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onContentSizeCategoryChange:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];
}

- (void)onAppearanceChange:(NSNotification *)notification {
    std::string colorScheme = [self getColorScheme];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleAppearanceChange(colorScheme);
    }
}

- (void)onContentSizeCategoryChange:(NSNotification *)notification {
    UIContentSizeCategory contentSizeCategory = [[UIApplication sharedApplication] preferredContentSizeCategory];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleContentSizeCategoryChange([self getContentSizeCategory:contentSizeCategory]);
    }
}

- (void)onOrientationChange:(NSNotification *)notification {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        UIScreen *mainScreen = [UIScreen mainScreen];
        Dimensions screen = {(int)mainScreen.bounds.size.width, (int)mainScreen.bounds.size.height};
        Insets insets = [self getInsets];
        Dimensions statusBar = [self getStatusBarDimensions];
        Dimensions navigationBar = [self getNavigationBarDimensions];

        if (self.unistylesRuntime != nullptr) {
            ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange(screen, insets, statusBar, navigationBar);
        }
    });
}

- (std::string)getColorScheme {
    UIUserInterfaceStyle colorScheme = [UIScreen mainScreen].traitCollection.userInterfaceStyle;

    switch (colorScheme) {
        case UIUserInterfaceStyleLight:
            return UnistylesLightScheme;
        case UIUserInterfaceStyleDark:
            return UnistylesDarkScheme;
        case UIUserInterfaceStyleUnspecified:
        default:
            return UnistylesUnspecifiedScheme;
    }
}

- (Insets)getInsets {
    UIWindow *window = UIApplication.sharedApplication.windows.firstObject;
    UIEdgeInsets safeArea = window.safeAreaInsets;
    
    return {(int)safeArea.top, (int)safeArea.bottom, (int)safeArea.left, (int)safeArea.right};
}

- (Dimensions)getStatusBarDimensions {
    CGRect statusBarFrame = UIApplication.sharedApplication.statusBarFrame;
    
    return {(int)statusBarFrame.size.width, (int)statusBarFrame.size.height};
}

- (Dimensions)getNavigationBarDimensions {
    return {0, 0};
}

- (std::string)getContentSizeCategory:(UIContentSizeCategory)contentSizeCategory {
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraExtraExtraLarge]) {
        return std::string([@"xxxLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraExtraLarge]) {
        return std::string([@"xxLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraLarge]) {
        return std::string([@"xLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryLarge]) {
        return std::string([@"Large" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryMedium]) {
        return std::string([@"Medium" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategorySmall]) {
        return std::string([@"Small" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraSmall]) {
        return std::string([@"xSmall" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityMedium]) {
        return std::string([@"accessibilityMedium" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityLarge]) {
        return std::string([@"accessibilityLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraLarge]) {
        return std::string([@"accessibilityExtraLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraExtraLarge]) {
        return std::string([@"accessibilityExtraExtraLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraExtraExtraLarge]) {
        return std::string([@"accessibilityExtraExtraExtraLarge" UTF8String]);
    }
    
    return std::string([@"unspecified" UTF8String]);
}

@end

#endif
