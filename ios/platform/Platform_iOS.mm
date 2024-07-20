#if TARGET_OS_IOS

#import "Platform_iOS.h"
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
                                          name:RCTWindowFrameDidChangeNotification
                                          object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                          name: RCTUserInterfaceStyleDidChangeNotification
                                          object: nil];
}

- (void)setupListeners {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onWindowChange:)
                                                 name:RCTWindowFrameDidChangeNotification
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

- (void)makeShared:(void*)runtime {
    self.unistylesRuntime = runtime;

    auto unistylesRuntime = ((UnistylesRuntime*)self.unistylesRuntime);

    unistylesRuntime->setScreenDimensionsCallback([self](){
        return [self getScreenDimensions];
    });

    unistylesRuntime->setContentSizeCategoryCallback([](){
        return getContentSizeCategory();
    });

    unistylesRuntime->setColorSchemeCallback([self](){
        return getColorScheme();
    });

    unistylesRuntime->setStatusBarDimensionsCallback([self](){
        return [self getStatusBarDimensions];
    });

    unistylesRuntime->setInsetsCallback([self](){
        return [self getInsets];
    });

    unistylesRuntime->setStatusBarHiddenCallback([self](bool hidden){
        return [self setStatusBarHidden:hidden];
    });

    unistylesRuntime->setImmersiveModeCallback([self](bool hidden){
        return [self setStatusBarHidden:hidden];
    });

    unistylesRuntime->setRootViewBackgroundColorCallback([self](const std::string &color, float alpha){
        return [self setRootViewBackgroundColor:color alpha:alpha];
    });

    dispatch_async(dispatch_get_main_queue(), ^{
        Screen screen = [self getScreenDimensions];

        unistylesRuntime->screen = Dimensions({ screen.width, screen.height });
        unistylesRuntime->contentSizeCategory = getContentSizeCategory();
        unistylesRuntime->colorScheme = getColorScheme();
        unistylesRuntime->statusBar = [self getStatusBarDimensions];
        unistylesRuntime->insets = [self getInsets];
        unistylesRuntime->pixelRatio = screen.pixelRatio;
        unistylesRuntime->fontScale = screen.fontScale;
        unistylesRuntime->rtl = [self isRtl];
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

- (void)onWindowChange:(NSNotification *)notification {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        UIApplicationState appState = [UIApplication sharedApplication].applicationState;

        if (appState == UIApplicationStateBackground) {
            return;
        }

        Screen screen = [self getScreenDimensions];
        Insets insets = [self getInsets];
        Dimensions statusBar = [self getStatusBarDimensions];

        if (self.unistylesRuntime != nullptr) {
            ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange(screen, insets, statusBar, std::nullopt);
        }
    });
}

- (Insets)getInsets {
    UIWindow *window = UIApplication.sharedApplication.windows.firstObject;
    UIEdgeInsets safeArea = window.safeAreaInsets;

    return {(int)safeArea.top, (int)safeArea.bottom, (int)safeArea.left, (int)safeArea.right};
}

- (Dimensions)getStatusBarDimensions {
    UIWindow *window = UIApplication.sharedApplication.windows.firstObject;
    CGRect statusBarFrame = window.windowScene.statusBarManager.statusBarFrame;

    return {(int)statusBarFrame.size.width, (int)statusBarFrame.size.height};
}

- (Screen)getScreenDimensions {
    UIViewController *presentedViewController = RCTPresentedViewController();
    CGRect windowFrame = presentedViewController.view.window.frame;
    int width = (int)windowFrame.size.width;
    int height = (int)windowFrame.size.height;
    float pixelRatio = presentedViewController.view.window.screen.scale;
    float fontScale = getFontScale();

    return Screen({width, height, pixelRatio, fontScale});
}

- (bool)isRtl {
    // forced by React Native
    BOOL hasForcedRtl = [[NSUserDefaults standardUserDefaults] boolForKey:@"RCTI18nUtil_forceRTL"];
    // user preferences
    BOOL isRtl = [UIApplication sharedApplication].userInterfaceLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
    
    return hasForcedRtl || isRtl;
}

- (void)setStatusBarHidden:(bool)isHidden {
    // forward it to React Native ViewController
    dispatch_async(dispatch_get_main_queue(), ^{
        #pragma clang diagnostic ignored "-Wdeprecated-declarations"
        [RCTSharedApplication() setStatusBarHidden:isHidden animated:true];
    });
}

- (void)setRootViewBackgroundColor:(std::string)color alpha:(float)alpha {
    UIViewController *presentedViewController = RCTPresentedViewController();
    NSString *colorString = [NSString stringWithUTF8String:color.c_str()];
    UIColor *backgroundColor = colorFromHexString(colorString, alpha);

    if (backgroundColor == nil) {
        NSLog(@"🦄 Unistyles: Couldn't set rootView to %@ color", colorString);

        return;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        presentedViewController.view.backgroundColor = backgroundColor;
    });
}

@end

#endif
