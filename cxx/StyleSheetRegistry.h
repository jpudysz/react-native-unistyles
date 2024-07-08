#include <folly/FBVector.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include "StyleSheetHolder.h"
#include "UnistylesRuntime.h"

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry(jsi::Runtime& rt, std::shared_ptr<UnistylesRuntime> unistylesRuntime): rt{rt}, unistylesRuntime{unistylesRuntime} {}
    
    int add(jsi::Object styleSheet);
    jsi::Object parse(int styleSheetTag);
    
private:
    jsi::Value getCurrentTheme();
    jsi::Value getMiniRuntime();
    void addStyleSheetFunction(jsi::Function styleSheetFunction, int nextTag);
    
    jsi::Runtime& rt;
    jsi::Value currentTheme;
    jsi::Value miniRuntime;
    std::shared_ptr<UnistylesRuntime> unistylesRuntime;
    folly::fbvector<StyleSheetHolder> styleSheets;
};
