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
    
    dispatch_async(dispatch_get_main_queue(), ^{
        unistylesRuntime->screen = [self getScreenDimensions];
        unistylesRuntime->contentSizeCategory = getContentSizeCategory();
        unistylesRuntime->colorScheme = getColorScheme();
        unistylesRuntime->statusBar = [self getStatusBarDimensions];
        unistylesRuntime->insets = [self getInsets];
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
        Dimensions screen = [self getScreenDimensions];
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

- (Dimensions)getScreenDimensions {
    UIViewController *presentedViewController = RCTPresentedViewController();
    CGRect windowFrame = presentedViewController.view.window.frame;
    Dimensions screenDimension = {(int)windowFrame.size.width, (int)windowFrame.size.height};
    
    return screenDimension;
}

@end

#endif
