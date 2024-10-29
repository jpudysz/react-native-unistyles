#import "UnistylesModuleOnLoad.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStyleSheet.h"
#import "HybridShadowRegistry.h"

using namespace margelo::nitro;

@implementation UnistylesModule

RCT_EXPORT_MODULE(Unistyles)

__weak RCTSurfacePresenter* _surfacePresenter;

 @synthesize runtimeExecutor = _runtimeExecutor;

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter {
    _surfacePresenter = surfacePresenter;
}

- (void)installJSIBindingsWithRuntime:(jsi::Runtime&)rt {
    // function is called on: first init and every live reload
    // check if this is live reload, if so let's replace UnistylesRuntime with new runtime
    auto hasUnistylesRuntime = HybridObjectRegistry::hasHybridObject("UnistylesRuntime");

    if (hasUnistylesRuntime) {
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesRuntime");
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesStyleSheet");
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesShadowRegistry");
    }

    [self createHybrids:rt];
}

- (void)createHybrids:(jsi::Runtime&)rt {
    auto runOnJSThread = ([executor = _runtimeExecutor](std::function<void(jsi::Runtime& rt)> &&callback) {
        __block auto objcCallback = callback;

        [executor execute:^(jsi::Runtime& rt){
            objcCallback(rt);
        }];
    });

    auto nativePlatform = Unistyles::NativePlatform::create();
    auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform, rt, runOnJSThread);
    auto uiManager = [_surfacePresenter scheduler].uiManager;
    auto styleSheet = std::make_shared<HybridStyleSheet>(unistylesRuntime, uiManager);

    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
        return unistylesRuntime;
    });
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesStyleSheet", [styleSheet]() -> std::shared_ptr<HybridObject>{
        return styleSheet;
    });
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesShadowRegistry", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridShadowRegistry>();
    });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTurboUnistylesSpecJSI>(params);
}

@end
