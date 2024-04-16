#if TARGET_OS_VISION

#import "Platform_visionOS.h"
#import "UnistylesRuntime.h"
#import <React/RCTAppearance.h>

@implementation Platform

- (instancetype)init {
    self = [super init];
    if (self) {
        UIWindow* mainWindow = [self getMainWindow];
        UIContentSizeCategory contentSizeCategory = [[UIApplication sharedApplication] preferredContentSizeCategory];

        self.initialScreen = {(int)mainWindow.bounds.size.width, (int)mainWindow.bounds.size.height};
        self.initialColorScheme = UnistylesUnspecifiedScheme;
        self.initialContentSizeCategory = [self getContentSizeCategory:contentSizeCategory];
        self.initialStatusBar = [self getStatusBarDimensions];
        self.initialInsets = [self getInsets];
        
        [self setupListeners];
    }
    return self;
}

- (UIWindow *)getMainWindow {
    if (RCTRunningInAppExtension()) {
      return nil;
    }
   
    for (UIScene* scene in RCTSharedApplication().connectedScenes) {
      if (scene.activationState != UISceneActivationStateForegroundActive || ![scene isKindOfClass:[UIWindowScene class]]) {
        continue;
      }
      UIWindowScene *windowScene = (UIWindowScene *)scene;
   
      for (UIWindow *window in windowScene.windows) {
        if (window.isKeyWindow) {
          return window;
        }
      }
    }
   
    return nil;
}

- (void)dealloc {
    if (self.unistylesRuntime != nullptr) {
        self.unistylesRuntime = nullptr;
    }

    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: UIContentSizeCategoryDidChangeNotification
                                          object: nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: RCTWindowFrameDidChangeNotification
                                          object: nil];
}

- (void)setupListeners {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onContentSizeCategoryChange:)
                                                 name:UIContentSizeCategoryDidChangeNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onWindowResize:)
                                                 name:RCTWindowFrameDidChangeNotification
                                               object:nil];
}

- (void)onWindowResize:(NSNotification *)notification {
    UIWindow* mainWindow = [self getMainWindow];

    Dimensions screen = {(int)mainWindow.frame.size.width, (int)mainWindow.frame.size.height};
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

- (void)onContentSizeCategoryChange:(NSNotification *)notification {
    UIContentSizeCategory contentSizeCategory = [[UIApplication sharedApplication] preferredContentSizeCategory];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleContentSizeCategoryChange([self getContentSizeCategory:contentSizeCategory]);
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
