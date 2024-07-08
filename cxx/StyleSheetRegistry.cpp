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

int StyleSheetRegistry::add(jsi::Object styleSheet) {
    static int tag = 0;
    
    if (styleSheet.isFunction(rt)) {
        addStyleSheetFunction(styleSheet.asFunction(rt), ++tag);
    
        return tag;
    }
    
    // stylesheet is static
    StyleSheetHolder st {
        ++tag,
        StyleSheetType::Static,
        std::move(styleSheet)
    };
    this->styleSheets.push_back(std::move(st));
    
    return tag;
}

jsi::Value StyleSheetRegistry::getCurrentTheme() {
    // todo move me to const
    auto getCurrentThemeFn = rt.global().getProperty(rt, jsi::PropNameID::forUtf8(rt, "__UNISTYLES__GET_SELECTED_THEME__"));

    if (getCurrentThemeFn.isUndefined()) {
        // todo throw error
        return jsi::Value::undefined();
    }

    auto theme = getCurrentThemeFn.asObject(rt).asFunction(rt).call(rt, jsi::String::createFromUtf8(rt, unistylesRuntime->themeName));
    
    return theme;
}

jsi::Value StyleSheetRegistry::getMiniRuntime() {
    auto miniRuntime = jsi::Object(rt);

    // todo extend me!
    // todo make fn name optional
    miniRuntime.setProperty(rt, jsi::PropNameID::forUtf8(rt, "insets"), unistylesRuntime->getInsets(rt, ""));
    
    return miniRuntime;
}

jsi::Object StyleSheetRegistry::parse(int styleSheetTag) {
    auto it = std::find_if(styleSheets.rbegin(), styleSheets.rend(), [styleSheetTag](StyleSheetHolder& st){
        return st.tag == styleSheetTag;
    });
    
    if (it != styleSheets.rbegin()) {
        // todo throw error
        
        return jsi::Object(rt);
    }
    
    auto styleSheet = it.base() - 1;

    // sorry pal, nothing to do here
    if (styleSheet->type == StyleSheetType::Static) {
        return jsi::Value(rt, styleSheet->value).asObject(rt);
    }
    
    // first stylesheet may have empty theme na runtime
    if (currentTheme.isUndefined()) {
        currentTheme = getCurrentTheme();
    }
    
    if (miniRuntime.isUndefined()) {
        miniRuntime = getMiniRuntime();
    }
    
    auto parsedStyleSheet = styleSheet->value.asFunction(rt).call(rt, std::move(currentTheme), std::move(miniRuntime)).asObject(rt);
    
    return parsedStyleSheet;
}
