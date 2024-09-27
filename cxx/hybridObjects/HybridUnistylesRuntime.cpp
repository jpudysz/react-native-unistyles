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
    this->_onDependenciesChange({UnistyleDependency::THEME, UnistyleDependency::THEMENAME});
};

void HybridUnistylesRuntime::setAdaptiveThemes(bool isEnabled) {
    auto& registry = core::UnistylesRegistry::get();
    
    std::vector<UnistyleDependency> changedDependencies{};
    bool hadAdaptiveThemes = this->getHasAdaptiveThemes();

    registry.setPrefersAdaptiveThemes(*_rt, isEnabled);
    
    bool haveAdaptiveThemes = this->getHasAdaptiveThemes();
    
    if (hadAdaptiveThemes != haveAdaptiveThemes) {
        changedDependencies.push_back(UnistyleDependency::ADAPTIVETHEMES);
    }

    // if user disabled it, or can't have adaptive themes, do nothing
    if (!this->getHasAdaptiveThemes()) {
        this->_onDependenciesChange(changedDependencies);
        
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
        changedDependencies.push_back(UnistyleDependency::THEME);
        changedDependencies.push_back(UnistyleDependency::THEMENAME);
        
        state.setTheme(nextTheme);
    }
    
    this->_onDependenciesChange(changedDependencies);
};

jsi::Value HybridUnistylesRuntime::updateTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, args[0].isString(), "first argument expected to be a string.");
    helpers::assertThat(rt, args[1].isObject(), "second argument expected to be a function.");

    auto& registry = core::UnistylesRegistry::get();
    auto themeName = args[0].asString(rt).utf8(rt);

    helpers::assertThat(rt, args[1].asObject(rt).isFunction(rt), "second argument expected to be a function.");

    registry.updateTheme(rt, themeName, args[1].asObject(rt).asFunction(rt));
    
    this->_onDependenciesChange({UnistyleDependency::THEME});

    return jsi::Value::undefined();
}

void HybridUnistylesRuntime::setImmersiveMode(bool isEnabled) {
    this->_nativePlatform.setImmersiveMode(isEnabled);
};

void HybridUnistylesRuntime::setRootViewBackgroundColor(double color) {
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

jsi::Value HybridUnistylesRuntime::getMiniRuntimeAsValue(jsi::Runtime& rt) {
    auto miniRuntime = this->getMiniRuntime();
    jsi::Object obj(rt);

    // auto generated by nitro, but can't be accessed due to static inline function
    obj.setProperty(rt, "themeName", JSIConverter<std::optional<std::string>>::toJSI(rt, miniRuntime.themeName));
    obj.setProperty(rt, "breakpoint", JSIConverter<std::optional<std::string>>::toJSI(rt, miniRuntime.breakpoint));
    obj.setProperty(rt, "orientation", JSIConverter<Orientation>::toJSI(rt, miniRuntime.orientation));
    obj.setProperty(rt, "hasAdaptiveThemes", JSIConverter<bool>::toJSI(rt, miniRuntime.hasAdaptiveThemes));
    obj.setProperty(rt, "colorScheme", JSIConverter<ColorScheme>::toJSI(rt, miniRuntime.colorScheme));
    obj.setProperty(rt, "screen", JSIConverter<Dimensions>::toJSI(rt, miniRuntime.screen));
    obj.setProperty(rt, "contentSizeCategory", JSIConverter<std::string>::toJSI(rt, miniRuntime.contentSizeCategory));
    obj.setProperty(rt, "insets", JSIConverter<Insets>::toJSI(rt, miniRuntime.insets));
    obj.setProperty(rt, "pixelRatio", JSIConverter<double>::toJSI(rt, miniRuntime.pixelRatio));
    obj.setProperty(rt, "fontScale", JSIConverter<double>::toJSI(rt, miniRuntime.fontScale));
    obj.setProperty(rt, "rtl", JSIConverter<bool>::toJSI(rt, miniRuntime.rtl));
    obj.setProperty(rt, "statusBar", JSIConverter<Dimensions>::toJSI(rt, miniRuntime.statusBar));
    obj.setProperty(rt, "navigationBar", JSIConverter<Dimensions>::toJSI(rt, miniRuntime.navigationBar));

    return obj;
}

jsi::Runtime& HybridUnistylesRuntime::getRuntime() {
    return *this->_rt;
}

void HybridUnistylesRuntime::registerPlatformListener(const std::function<void(std::vector<UnistyleDependency>)>& listener) {
    this->_nativePlatform.registerPlatformListener(listener);
    this->_onDependenciesChange = listener;
}
