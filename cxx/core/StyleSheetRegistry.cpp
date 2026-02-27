#include "StyleSheetRegistry.h"
#include "UnistylesRegistry.h"

using namespace margelo::nitro::unistyles::core;
using namespace facebook;

std::shared_ptr<StyleSheet> StyleSheetRegistry::addStyleSheetFromValue(jsi::Runtime& rt, jsi::Object rawStyleSheet) {
    if (rawStyleSheet.isFunction(rt)) {
        return this->addFromFunction(rt, rawStyleSheet.asFunction(rt));
    }

    return this->addFromObject(rt, std::move(rawStyleSheet));
}

std::shared_ptr<StyleSheet> StyleSheetRegistry::addFromFunction(jsi::Runtime& rt, jsi::Function styleSheetFn) {
    auto numberOfArgs = styleSheetFn.getProperty(rt, "length").getNumber();

    helpers::assertThat(rt, numberOfArgs <= 2, "StyleSheet.create expected up to 2 arguments.");

    auto& registry = UnistylesRegistry::get();

    // stylesheet is still static, remove the function wrapper
    if (numberOfArgs == 0) {
        auto staticStyleSheet = styleSheetFn.call(rt).asObject(rt);

        return registry.addStyleSheet(rt, core::StyleSheetType::Static, std::move(staticStyleSheet));
    }

    // stylesheet depends only on theme
    if (numberOfArgs == 1) {
        return registry.addStyleSheet(rt, core::StyleSheetType::Themable, std::move(styleSheetFn));
    }

    // stylesheet depends on theme and mini runtime
    return registry.addStyleSheet(rt, core::StyleSheetType::ThemableWithMiniRuntime, std::move(styleSheetFn));
}

std::shared_ptr<StyleSheet> StyleSheetRegistry::addFromObject(jsi::Runtime& rt, jsi::Object rawStyleSheet) {
    auto& registry = UnistylesRegistry::get();

    return registry.addStyleSheet(rt, core::StyleSheetType::Static, std::move(rawStyleSheet));
}
