#include "StyleSheetRegistry.h"

using namespace margelo::nitro::unistyles::core;

StyleSheet& StyleSheetRegistry::add(jsi::Runtime& rt, jsi::Object rawStyleSheet) {
    static unsigned int tag = 0;

    if (rawStyleSheet.isFunction(rt)) {
        return this->addFromFunction(rt, ++tag, rawStyleSheet.asFunction(rt));
    }

    return this->addFromObject(rt, ++tag, std::move(rawStyleSheet));
}

StyleSheet& StyleSheetRegistry::addFromObject(jsi::Runtime &rt, unsigned int tag, jsi::Object rawStyleSheet) {
    this->styleSheets.emplace_back(tag, core::StyleSheetType::Static, std::move(rawStyleSheet));

    return this->styleSheets.back();
}

StyleSheet& StyleSheetRegistry::addFromFunction(jsi::Runtime &rt, unsigned int tag, jsi::Function styleSheetFn) {
    auto numberOfArgs = styleSheetFn.getProperty(rt, "length").getNumber();

    helpers::assertThat(rt, numberOfArgs <= 2, "Function passed to StyleSheet.create can't have more than 2 arguments.");

    // stylesheet is still static, remove the function wrapper
    if (numberOfArgs == 0) {
        auto staticStyleSheet = styleSheetFn.call(rt).asObject(rt);

        this->styleSheets.emplace_back(tag, core::StyleSheetType::Static, std::move(styleSheetFn));
    }

    // stylesheet depends only on theme
    if (numberOfArgs == 1) {
        this->styleSheets.emplace_back(tag, core::StyleSheetType::Themable, std::move(styleSheetFn));
    }

    // stylesheet depends on theme and mini runtime
    if (numberOfArgs == 2) {
        this->styleSheets.emplace_back(tag, core::StyleSheetType::ThemableWithMiniRuntime, std::move(styleSheetFn));
    }

    return this->styleSheets.back();
}

void StyleSheetRegistry::remove(unsigned int tag) {
    auto it = std::find_if(
        this->styleSheets.cbegin(),
        this->styleSheets.cend(),
        [tag](const StyleSheet& styleSheet){
            return styleSheet.tag == tag;
        }
    );

    if (it == this->styleSheets.cend()) {
        throw std::runtime_error("StyleSheet with tag: " + std::to_string(tag) + " cannot be found.");
    }

    this->styleSheets.erase(it);
}

jsi::Object StyleSheetRegistry::parse(jsi::Runtime &rt, const StyleSheet &styleSheet) {
    jsi::Object unwrappedStyleSheet = this->unwrapStyleSheet(rt, styleSheet);

    // todo parse it

    return unwrappedStyleSheet;
}

jsi::Object StyleSheetRegistry::unwrapStyleSheet(jsi::Runtime &rt, const StyleSheet &styleSheet) {
    // firstly we need to get object representation of user's StyleSheet
    // StyleSheet can be a function or an object

    // StyleSheet is already an object
    if (styleSheet.type == StyleSheetType::Static) {
        return jsi::Value(rt, styleSheet.rawValue).asObject(rt);
    }

    // StyleSheet is a function
    auto theme = this->getCurrentTheme(rt);

    if (styleSheet.type == StyleSheetType::Themable) {
        return styleSheet.rawValue
            .asFunction(rt)
            .call(rt, std::move(theme))
            .asObject(rt);
    }

    // stylesheet also has a mini runtime
    auto miniRuntime = this->getMiniRuntime(rt);

    return styleSheet.rawValue
        .asFunction(rt)
        .call(rt, std::move(theme), std::move(miniRuntime))
        .asObject(rt);
}

jsi::Object StyleSheetRegistry::getCurrentTheme(jsi::Runtime& rt) {
    helpers::assertThat(rt, this->cachedTheme.has_value(), "failed to load the theme. Did you forget to select initial one?");
    
    auto& theme = this->cachedTheme.value();
    
    helpers::assertThat(rt, theme.lock(rt).isObject(), "not able to retrieve a theme. Please report issue with steps to reproduce.");
    
    return theme.lock(rt).asObject(rt);
}

jsi::Object StyleSheetRegistry::getMiniRuntime(jsi::Runtime& rt) {
    helpers::assertThat(rt, this->cachedMiniRuntime.has_value(), "failed to load mini runtime. Please report issue with steps to reproduce.");
    
    return std::move(this->cachedMiniRuntime.value());
}

void StyleSheetRegistry::cacheCurrentTheme(jsi::WeakObject&& theme) {
    this->cachedTheme = jsi::WeakObject(std::move(theme));
}

void StyleSheetRegistry::cacheMiniRuntime(jsi::Object&& miniRuntime) {
    this->cachedMiniRuntime = std::move(miniRuntime);
}
