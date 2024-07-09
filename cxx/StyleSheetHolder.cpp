#include "StyleSheetHolder.h"

void StyleSheetHolder::compute(jsi::Runtime& rt, jsi::Object& stylesheet) {
    jsi::Object styles(rt);
    jsi::Array propertyNames = stylesheet.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);
    
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = stylesheet.getProperty(rt, propertyName.c_str()).asObject(rt);
        
        // dynamic functions are handled in the next step
        if (propertyValue.isFunction(rt)) {
            continue;
        }
        
        folly::dynamic parsedStyle = jsi::dynamicFromValue(rt, std::move(propertyValue));
        
        // todo get it from babel
        folly::fbvector<StyleDependencies> deps {StyleDependencies::Theme, StyleDependencies::Screen};
        
        Unistyle style = {UnistyleType::Object, propertyName, parsedStyle, deps};
        
        this->styles.push_back(std::move(style));
    }
}
