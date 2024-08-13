#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStatusBar.h"
#import "HybridNavigationBar.h"

using namespace margelo::nitro;

@interface UnistylesModule: NSObject
@end

@implementation UnistylesModule

+ (void)load  {
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridUnistylesRuntime>();
    });
    HybridObjectRegistry::registerHybridObjectConstructor("StatusBar", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridStatusBar>();
    });
    HybridObjectRegistry::registerHybridObjectConstructor("NavigationBar", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridNavigationBar>();
    });
}

@end
