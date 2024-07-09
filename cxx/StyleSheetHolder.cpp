#include "StyleSheetHolder.h"

void StyleSheetHolder::parseStyles(jsi::Runtime& rt, jsi::Object& stylesheet) {
    unistyles::helpers::enumerateJSIObject(rt, stylesheet, [&](const std::string& propertyName, jsi::Value& propertyValue) {
        // dynamic functions are handled in the next step
        if (propertyValue.asObject(rt).isFunction(rt)) {
            return;
        }
        
        Unistyle unistyle = {rt, UnistyleType::Object, propertyName, std::move(propertyValue)};
        
        this->styles.push_back(std::move(unistyle));
    });
}
