#import "UnistylesModuleOnLoad.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStyleSheet.h"
#import "HybridShadowRegistry.h"

using namespace margelo::nitro;

@implementation UnistylesModule

RCT_EXPORT_MODULE(Unistyles)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)installJSIBindingsWithRuntime:(jsi::Runtime&)rt callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callInvoker {
    // function is called on: first init and every live reload
    // check if this is live reload, if so let's replace UnistylesRuntime with new runtime
    auto hasUnistylesRuntime = HybridObjectRegistry::hasHybridObject("UnistylesRuntime");

    if (hasUnistylesRuntime) {
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesRuntime");
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesStyleSheet");
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesShadowRegistry");
    }

    [self createHybrids:rt callInvoker:callInvoker];
}

- (void)createHybrids:(jsi::Runtime&)rt callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callInvoker {
    auto runOnJSThread = [callInvoker](std::function<void(jsi::Runtime& rt)> &&callback){
        callInvoker->invokeAsync(std::move(callback));
    };

    auto nativePlatform = Unistyles::NativePlatform::create().getCxxPart();
    auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform, rt, runOnJSThread);
    auto styleSheet = std::make_shared<HybridStyleSheet>(unistylesRuntime);

    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
        return unistylesRuntime;
    });
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesStyleSheet", [styleSheet]() -> std::shared_ptr<HybridObject>{
        return styleSheet;
    });
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesShadowRegistry", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridShadowRegistry>(unistylesRuntime);
    });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTurboUnistylesSpecJSI>(params);
}

- (void)invalidate {
    core::UnistylesRegistry::get().destroy();
    [super invalidate];
}

@end
