#if TARGET_OS_TV

#import "Platform_tvOS.h"
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
    return {0, 0, 0, 0};
}

- (Dimensions)getStatusBarDimensions {
    return {0, 0};
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
