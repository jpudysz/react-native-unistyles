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

    return;
}

StyleSheetHolder& StyleSheetRegistry::add(jsi::Object styleSheet) {
    static int tag = 0;

    if (styleSheet.isFunction(rt)) {
        addStyleSheetFunction(styleSheet.asFunction(rt), ++tag);

        return this->styleSheets.back();
    }

    // stylesheet is static
    StyleSheetHolder st {
        ++tag,
        StyleSheetType::Static,
        std::move(styleSheet)
    };
    this->styleSheets.push_back(std::move(st));

    return this->styleSheets.back();
}

jsi::Value StyleSheetRegistry::getCurrentTheme() {
    // todo move me to const
    auto getCurrentThemeFn = rt.global().getProperty(rt, jsi::PropNameID::forUtf8(rt, "__UNISTYLES__GET_SELECTED_THEME__"));

    if (getCurrentThemeFn.isUndefined()) {
        // todo throw error
        return jsi::Value::undefined();
    }

    auto theme = getCurrentThemeFn
        .asObject(rt)
        .asFunction(rt)
        .call(rt, jsi::String::createFromUtf8(rt, unistylesRuntime->themeName));

    return theme;
}

jsi::Value StyleSheetRegistry::getMiniRuntime() {
    auto miniRuntime = jsi::Object(rt);

    // todo extend me to equal mini runtime!
    // todo make fn name optional
    miniRuntime.setProperty(rt, jsi::PropNameID::forUtf8(rt, "insets"), unistylesRuntime->getInsets(rt, ""));

    return miniRuntime;
}

jsi::Object StyleSheetRegistry::dereferenceStyleSheet(StyleSheetHolder& styleSheet) {
    // nothing to do here, stylesheet is already an object
    if (styleSheet.type == StyleSheetType::Static) {
        return jsi::Value(rt, styleSheet.value).asObject(rt);
    }

    // first iteration may have empty theme and runtime
    // also, we had to wait for user selection
    if (currentTheme.isUndefined()) {
        currentTheme = getCurrentTheme();
    }

    if (miniRuntime.isUndefined()) {
        miniRuntime = getMiniRuntime();
    }

    // dereference from function
    auto parsedStyleSheet = styleSheet
        .value
        .asFunction(rt)
        .call(rt, std::move(currentTheme), std::move(miniRuntime)).asObject(rt);

    return wrapInHostFunction(styleSheet, parsedStyleSheet);
}

// Function wraps any dynamic function with proxy to memoize the last arguments
// it also moves the original function to new object's key and uses host function as the replacement for the original one
jsi::Object StyleSheetRegistry::wrapInHostFunction(StyleSheetHolder& holder, jsi::Object& stylesheet) {
    jsi::Object mergedStyles = jsi::Object(rt);

    unistyles::helpers::enumerateJSIObject(rt, stylesheet, [&](const std::string& propertyName, jsi::Object& propertyValue){
        // value is not a function, simply create unistyle
        if (!propertyValue.isFunction(rt)) {
            Unistyle unistyle{UnistyleType::Object, propertyName, std::move(propertyValue), this->unistylesRuntime};
            
            holder.styles.push_back(std::move(unistyle));
            
            return;
        }

        // proxy function
        auto hostFn = unistyles::helpers::createHostFunction(rt, propertyName, 1, [&, propertyName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
            // call original function function
            auto result = thisVal
                .asObject(rt)
                .getProperty(rt, jsi::String::createFromUtf8(rt, PROXY_FN_PREFIX + propertyName))
                .asObject(rt)
                .asFunction(rt)
                .call(rt, arguments, count);

            auto it = std::find_if(
                holder.styles.begin(),
                holder.styles.end(),
                [&propertyName](const Unistyle& style) {
                    return style.name == propertyName;
                }
            );

            // styles have been already created, just update metadata
            if (it != holder.styles.end()) {
                it->addDynamicFunctionMetadata(count, jsi::dynamicFromValue(rt, arguments));

                return result;
            }

            Unistyle unistyle{UnistyleType::DynamicFunction, propertyName, std::move(result), this->unistylesRuntime};
            
            unistyle.addDynamicFunctionMetadata(count, jsi::dynamicFromValue(rt, arguments));
            holder.styles.push_back(std::move(unistyle));
 
            return jsi::Value(rt, holder.styles.back().parseStyle(rt));
        });

        unistyles::helpers::defineFunctionProperty(rt, mergedStyles, PROXY_FN_PREFIX + propertyName, std::move(propertyValue));
        mergedStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), hostFn);
    });
    
    for (Unistyle& unistyle : holder.styles) {
        mergedStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.name), unistyle.parseStyle(rt));
    }

    return mergedStyles;
}
