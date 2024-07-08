#include "StyleSheetRegistry.h"

void StyleSheetRegistry::addStyleSheetFunction(jsi::Function styleSheetFunction, int nextTag) {
    auto numberOfArgs = styleSheetFunction.getProperty(rt, "length").getNumber();

    // stylesheet is still static, remove the function
    if (numberOfArgs == 0) {
        auto staticStylesheet = styleSheetFunction.call(rt).asObject(rt);
        
        StyleSheetHolder st {
            nextTag,
            StyleSheetType::Static,
            std::move(staticStylesheet)
        };
        this->styleSheets.push_back(std::move(st));
        
        return;
    }
    
    // stylesheet depends only on theme
    if (numberOfArgs == 1) {
        StyleSheetHolder st {
            nextTag,
            StyleSheetType::Themable,
            std::move(styleSheetFunction)
        };
        this->styleSheets.push_back(std::move(st));
        
        return;
    }
    
    // stylesheet depends on theme and mini runtime
    StyleSheetHolder st {
        nextTag,
        StyleSheetType::ThemableWithMiniRuntime,
        std::move(styleSheetFunction)
    };
    this->styleSheets.push_back(std::move(st));
}

void StyleSheetRegistry::add(jsi::Object styleSheet) {
    static int tag = 0;
    
    if (styleSheet.isFunction(rt)) {
        addStyleSheetFunction(styleSheet.asFunction(rt), ++tag);
        
        return;
    }
    
    // stylesheet is static
    StyleSheetHolder st {
        ++tag,
        StyleSheetType::Static,
        std::move(styleSheet)
    };
    this->styleSheets.push_back(std::move(st));
}
