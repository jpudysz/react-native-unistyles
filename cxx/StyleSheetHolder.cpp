#include "StyleSheetHolder.h"

void StyleSheetHolder::parseStyles(jsi::Runtime& rt, jsi::Object& stylesheet) {
    unistyles::helpers::enumerateJSIObject(rt, stylesheet, [&](const std::string& propertyName, jsi::Object& propertyValue) {
        // dynamic functions are handled in the next step
        if (propertyValue.isFunction(rt)) {
            return;
        }
        
        folly::dynamic parsedStyle = jsi::dynamicFromValue(rt, std::move(propertyValue));
        
        // todo get it from babel
        folly::fbvector<StyleDependencies> deps {StyleDependencies::Theme, StyleDependencies::Screen};
        
        Unistyle style = {UnistyleType::Object, propertyName, parsedStyle, deps};
        
        this->styles.push_back(std::move(style));
    });
}
