#include "HybridUnistylesRuntime.h"
#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;

ColorScheme HybridUnistylesRuntime::getColorScheme() {
    int colorScheme = this->_nativePlatform.getColorScheme();

    return static_cast<ColorScheme>(colorScheme);
}

bool HybridUnistylesRuntime::getHasAdaptiveThemes() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    return state.hasAdaptiveThemes();
};

Dimensions HybridUnistylesRuntime::getScreen() {
    return this->_nativePlatform.getScreenDimensions();
};

std::optional<std::string> HybridUnistylesRuntime::getThemeName() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    return state.getCurrentThemeName();
};

std::string HybridUnistylesRuntime::getContentSizeCategory() {
    return this->_nativePlatform.getContentSizeCategory();
};

std::optional<std::string> HybridUnistylesRuntime::getBreakpoint() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    return state.getCurrentBreakpointName();
};

bool HybridUnistylesRuntime::getRtl() {
    return this->_nativePlatform.getPrefersRtlDirection();
}

Insets HybridUnistylesRuntime::getInsets() {
    return this->_nativePlatform.getInsets();
};

Orientation HybridUnistylesRuntime::getOrientation() {
    int orientation = this->_nativePlatform.getOrientation();
    
    return static_cast<Orientation>(orientation);
};

double HybridUnistylesRuntime::getPixelRatio() {
    return this->_nativePlatform.getPixelRatio();
};

double HybridUnistylesRuntime::getFontScale() {
    return this->_nativePlatform.getFontScale();
};

void HybridUnistylesRuntime::setTheme(const std::string &themeName) {
    helpers::assertThat(*_rt, !this->getHasAdaptiveThemes(), "You're trying to set theme to: '" + themeName + "', but adaptiveThemes are enabled.");

    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    state.setTheme(themeName);
};


void HybridUnistylesRuntime::setAdaptiveThemes(bool isEnabled) {
    auto& registry = core::UnistylesRegistry::get();

    registry.setPrefersAdaptiveThemes(*_rt, isEnabled);

    // if user disabled it, or can't have adaptive themes, do nothing
    if (!this->getHasAdaptiveThemes()) {
        return;
    }

    // if user enabled adaptive themes, then we need to make sure
    // we selected theme based on color scheme
    auto& state = core::UnistylesRegistry::get().getState(*_rt);
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
    helpers::assertThat(rt, args[0].isString(), "first argument expected to be a string.");
    helpers::assertThat(rt, args[1].isObject(), "second argument expected to be a function.");

    auto& registry = core::UnistylesRegistry::get();
    auto themeName = args[0].asString(rt).utf8(rt);

    helpers::assertThat(rt, args[1].asObject(rt).isFunction(rt), "second argument expected to be a function.");

    registry.updateTheme(rt, themeName, args[1].asObject(rt).asFunction(rt));

    return jsi::Value::undefined();
}

void HybridUnistylesRuntime::setImmersiveMode(bool isEnabled) {
    this->_nativePlatform.setImmersiveMode(isEnabled);
};

void HybridUnistylesRuntime::setRootViewBackgroundColor(std::optional<double> color) {
    this->_nativePlatform.setRootViewBackgroundColor(color);
}

jsi::Value HybridUnistylesRuntime::createHybridStatusBar(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    if (this->_statusBar == nullptr) {
        this->_statusBar = std::make_shared<HybridStatusBar>(_nativePlatform);
    }

    return this->_statusBar->toObject(rt);
}

jsi::Value HybridUnistylesRuntime::createHybridNavigationBar(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    if (this->_navigationBar == nullptr) {
        this->_navigationBar = std::make_shared<HybridNavigationBar>(_nativePlatform);
    }

    return this->_navigationBar->toObject(rt);
}

UnistylesCxxMiniRuntime HybridUnistylesRuntime::getMiniRuntime() {
    UnistylesNativeMiniRuntime nativeMiniRuntime = this->_nativePlatform.getMiniRuntime();
    UnistylesCxxMiniRuntime cxxMiniRuntime{
        this->getThemeName(),
        this->getBreakpoint(),
        nativeMiniRuntime.orientation,
        this->getHasAdaptiveThemes(),
        nativeMiniRuntime.colorScheme,
        nativeMiniRuntime.screen,
        nativeMiniRuntime.contentSizeCategory,
        nativeMiniRuntime.insets,
        nativeMiniRuntime.pixelRatio,
        nativeMiniRuntime.fontScale,
        nativeMiniRuntime.rtl,
        nativeMiniRuntime.statusBar,
        nativeMiniRuntime.navigationBar
    };
    
    return cxxMiniRuntime;
}
