#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridMiniRuntime.h"
#import "HybridStatusBar.h"
#import "HybridNavigationBar.h"
#import "HybridStyleSheet.h"
#import "UnistylesState.h"

using namespace margelo::nitro;

@interface UnistylesModule: NSObject
@end

@implementation UnistylesModule

+ (void)load  {
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

@end
