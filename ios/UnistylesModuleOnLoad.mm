#import "UnistylesModuleOnLoad.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridShadowRegistry.h"
#import "HybridMiniRuntime.h"
#import "HybridStatusBar.h"
#import "HybridNavigationBar.h"
#import "HybridStyleSheet.h"
#import "UnistylesState.h"

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
        HybridObjectRegistry::unregisterHybridObjectConstructor("StatusBar");
        HybridObjectRegistry::unregisterHybridObjectConstructor("NavigationBar");
        HybridObjectRegistry::unregisterHybridObjectConstructor("StyleSheet");
        HybridObjectRegistry::unregisterHybridObjectConstructor("ShadowRegistry");
    }

    [self createHybrids:rt];
}

- (void)createHybrids:(jsi::Runtime&)rt {
    auto nativePlatform = Unistyles::NativePlatform::create();
    auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform, rt);
    auto shadowRegistry = std::make_shared<HybridShadowRegistry>();

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
    HybridObjectRegistry::registerHybridObjectConstructor("ShadowRegistry", [shadowRegistry]() -> std::shared_ptr<HybridObject>{
        return shadowRegistry;
    });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeTurboUnistylesSpecJSI>(params);
}

@end
