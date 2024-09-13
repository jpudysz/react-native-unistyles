#import "UnistylesModuleOnLoad.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStyleSheet.h"

using namespace margelo::nitro;

@implementation UnistylesModule

RCT_EXPORT_MODULE(Unistyles)

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (void)installJSIBindingsWithRuntime:(jsi::Runtime&)rt {
    // function is called on: first init and every live reload
    // check if this is live reload, if so let's replace UnistylesRuntime with new runtime
    auto hasUnistylesRuntime = HybridObjectRegistry::hasHybridObject("UnistylesRuntime");

    if (hasUnistylesRuntime) {
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesRuntime");
        HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesStyleSheet");
    }

    [self createHybrids:rt];
}

- (void)createHybrids:(jsi::Runtime&)rt {
    auto nativePlatform = Unistyles::NativePlatform::create();
    auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform, rt);
    auto styleSheet = std::make_shared<HybridStyleSheet>(unistylesRuntime);

    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
        return unistylesRuntime;
    });
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesStyleSheet", [styleSheet]() -> std::shared_ptr<HybridObject>{
        return styleSheet;
    });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTurboUnistylesSpecJSI>(params);
}

@end
