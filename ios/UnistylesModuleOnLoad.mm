#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStatusBar.h"
#import "HybridNavigationBar.h"

using namespace margelo::nitro;

@interface UnistylesModule: NSObject
@end

@implementation UnistylesModule

+ (void)load  {
    auto nativePlatform = Unistyles::NativePlatform::create();
    
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [nativePlatform]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridUnistylesRuntime>(nativePlatform);
    });
    HybridObjectRegistry::registerHybridObjectConstructor("StatusBar", [nativePlatform]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridStatusBar>(nativePlatform);
    });
    HybridObjectRegistry::registerHybridObjectConstructor("NavigationBar", [nativePlatform]() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridNavigationBar>(nativePlatform);
    });
}

@end
