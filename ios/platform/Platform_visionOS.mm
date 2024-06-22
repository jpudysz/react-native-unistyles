#if TARGET_OS_VISION

#import "Platform_visionOS.h"
#import "UnistylesRuntime.h"
#import <React/RCTAppearance.h>

@implementation Platform

- (instancetype)init {
    self = [super init];
    if (self) {
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
                                             selector:@selector(onWindowChange:)
                                                 name:RCTWindowFrameDidChangeNotification
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
    
    dispatch_async(dispatch_get_main_queue(), ^{
        unistylesRuntime->screen = [self getScreenDimensions];
        unistylesRuntime->contentSizeCategory = getContentSizeCategory();
    });
}

- (void)onWindowChange:(NSNotification *)notification {
    Dimensions screen = [self getScreenDimensions];

    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange(
           screen,
           std::nullopt,
           std::nullopt,
           std::nullopt
        );
    }
}

- (void)onContentSizeCategoryChange:(NSNotification *)notification {
    if (self.unistylesRuntime != nullptr) {
        ((UnistylesRuntime*)self.unistylesRuntime)->handleContentSizeCategoryChange(getContentSizeCategory());
    }
}

- (Dimensions)getScreenDimensions {
    UIWindow* mainWindow = [self getMainWindow];
    Dimensions screenDimension = {(int)mainWindow.frame.size.width, (int)mainWindow.frame.size.height};
    
    return screenDimension;
}

@end

#endif
