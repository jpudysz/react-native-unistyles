#include "HybridUnistylesRuntime.h"
#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;

jsi::Value HybridUnistylesRuntime::onLoad(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    this->rt = &rt;
    
    return jsi::Value::undefined();
}

ColorScheme HybridUnistylesRuntime::getColorScheme() {
    int colorScheme = this->nativePlatform.getColorScheme();

    return static_cast<ColorScheme>(colorScheme);
}

bool HybridUnistylesRuntime::getHasAdaptiveThemes() {
    auto& state = core::UnistylesRegistry::get().getState(*rt);
    
    return state.hasAdaptiveThemes();
};

Dimensions HybridUnistylesRuntime::getScreen() {
    return this->nativePlatform.getScreenDimensions();
};

std::optional<std::string> HybridUnistylesRuntime::getThemeName() {
    auto& state = core::UnistylesRegistry::get().getState(*rt);
    
    return state.getCurrentThemeName();
};

std::string HybridUnistylesRuntime::getContentSizeCategory() {
    return this->nativePlatform.getContentSizeCategory();
};

std::optional<std::string> HybridUnistylesRuntime::getBreakpoint() {
    auto& state = core::UnistylesRegistry::get().getState(*rt);
    
    return state.getCurrentBreakpointName();
};

bool HybridUnistylesRuntime::getRtl() {
    return this->nativePlatform.getPrefersRtlDirection();
}

Insets HybridUnistylesRuntime::getInsets() {
    return this->nativePlatform.getInsets();
};

Orientation HybridUnistylesRuntime::getOrientation() {
    auto screenDimensions = this->getScreen();

    if (screenDimensions.width > screenDimensions.height) {
        return Orientation::LANDSCAPE;
    }

    return Orientation::PORTRAIT;
};

double HybridUnistylesRuntime::getPixelRatio() {
    return this->nativePlatform.getPixelRatio();
};

double HybridUnistylesRuntime::getFontScale() {
    return this->nativePlatform.getFontScale();
};

void HybridUnistylesRuntime::setTheme(const std::string &themeName) {
    helpers::assertThat(*rt, !this->getHasAdaptiveThemes(), "You're trying to set theme to: '" + themeName + "', but adaptiveThemes are enabled.");
    
    auto& state = core::UnistylesRegistry::get().getState(*rt);
    
    state.setTheme(themeName);
};

void HybridUnistylesRuntime::setAdaptiveThemes(bool isEnabled) {
    auto& registry = core::UnistylesRegistry::get();
    
    registry.setPrefersAdaptiveThemes(*rt, isEnabled);
    
    // if user disabled it, or can't have adaptive themes, do nothing
    if (!this->getHasAdaptiveThemes()) {
        return;
    }
    
    // if user enabled adaptive themes, then we need to make sure
    // we selected theme based on color scheme
    auto& state = core::UnistylesRegistry::get().getState(*rt);
    auto colorScheme = this->getColorScheme();
    auto currentThemeName = this->getThemeName();
    auto nextTheme = colorScheme == ColorScheme::LIGHT
        ? "light"
        : "dark";

    if (!currentThemeName.has_value() || nextTheme != currentThemeName.value()) {
        state.setTheme(nextTheme);
    }
};

jsi::Value HybridUnistylesRuntime::updateTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "expected to be called with two arguments.");
    helpers::assertThat(rt, args[0].isString(), "first argument expected to be a string.");
    helpers::assertThat(rt, args[1].isObject(), "second argument expected to be a function.");
    
    auto& registry = core::UnistylesRegistry::get();
    auto themeName = args[0].asString(rt).utf8(rt);
    
    helpers::assertThat(rt, args[1].asObject(rt).isFunction(rt), "second argument expected to be a function.");

    registry.updateTheme(rt, themeName, args[1].asObject(rt).asFunction(rt));
    
    return jsi::Value::undefined();
}

void HybridUnistylesRuntime::setImmersiveMode(bool isEnabled) {};

void HybridUnistylesRuntime::setRootViewBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) {
    this->nativePlatform.setRootViewBackgroundColor(hex, alpha);
}

Dimensions HybridUnistylesRuntime::getStatusBarDimensions() {
    return this->nativePlatform.getStatusBarDimensions();
}

Dimensions HybridUnistylesRuntime::getNavigationBarDimensions() {
    return this->nativePlatform.getNavigationBarDimensions();
}
