#import "UnistylesModuleOnLoad.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStyleSheet.h"
#import "HybridShadowRegistry.h"
#include <atomic>

using namespace margelo::nitro;

@implementation UnistylesModule {
    // written on the JS thread at install, read from the teardown thread in invalidate
    std::atomic<jsi::Runtime*> _runtime;
}

RCT_EXPORT_MODULE(Unistyles)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)installJSIBindingsWithRuntime:(jsi::Runtime&)rt callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callInvoker {
    // function is called on: first init and every live reload
    // claim the state for this runtime; wipes a previous runtime's state if it hasn't been invalidated yet
    _runtime = &rt;
    core::UnistylesRegistry::get().takeOwnership(&rt);

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
    auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform, runOnJSThread);
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
    // no-op if a newer runtime already took ownership (see UnistylesRegistry::releaseOwnership)
    core::UnistylesRegistry::get().releaseOwnership(_runtime);

    [super invalidate];
}

@end
