#import "UnistylesModuleOnLoad.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridMiniRuntime.h"
#import "HybridStatusBar.h"
#import "HybridNavigationBar.h"
#import "HybridStyleSheet.h"
#import "UnistylesState.h"

using namespace margelo::nitro;

@implementation UnistylesModule {
    __weak id<RCTSurfacePresenterStub> _surfacePresenter;
}

// manually register TurboModule as Nitro also requires +load method
RCT_EXTERN void RCTRegisterModule(Class);

@synthesize bridge = _bridge;

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

+ (NSString *)moduleName {
    return @"Unistyles";
}

+ (void)load  {
    // init React Native Turbo Module
    RCTRegisterModule(self);
    
    // init all Nitro Hybrids
    auto nativePlatform = Unistyles::NativePlatform::create();
    auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform);

    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
        return unistylesRuntime;
    });
    HybridObjectRegistry::registerHybridObjectConstructor("StatusBar", [nativePlatform]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridStatusBar>(nativePlatform);
    });
    HybridObjectRegistry::registerHybridObjectConstructor("NavigationBar", [nativePlatform]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridNavigationBar>(nativePlatform);
    });
    HybridObjectRegistry::registerHybridObjectConstructor("StyleSheet", [nativePlatform, unistylesRuntime]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridStyleSheet>(nativePlatform, unistylesRuntime);
    });
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter {
    _surfacePresenter = surfacePresenter;
}

- (void)setBridge:(RCTBridge *)bridge {
    _bridge = bridge;

    // todo
    // grab runtime at any time
    // jsi::Runtime* runtime = reinterpret_cast<jsi::Runtime*>(_bridge.runtime);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTurboUnistylesSpecJSI>(params);
}

- (void)updateLayoutPropsWithViewTag:(NSNumber *)viewTag props:(NSDictionary *)uiProps {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self->_surfacePresenter synchronouslyUpdateViewOnUIThread:viewTag props:uiProps];
    });
}

@end
