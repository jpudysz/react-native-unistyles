#include "HybridUnistylesRuntime.h"
#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;

ColorScheme HybridUnistylesRuntime::getColorScheme() {
    auto colorScheme = this->_nativePlatform->getColorScheme();

    return static_cast<ColorScheme>(colorScheme);
}

bool HybridUnistylesRuntime::getHasAdaptiveThemes() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    return state.hasAdaptiveThemes();
};

Dimensions HybridUnistylesRuntime::getScreen() {
    return this->_nativePlatform->getScreenDimensions();
};

std::optional<std::string> HybridUnistylesRuntime::getThemeName() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    return state.getCurrentThemeName();
};

std::string HybridUnistylesRuntime::getContentSizeCategory() {
    return this->_nativePlatform->getContentSizeCategory();
};

std::optional<std::string> HybridUnistylesRuntime::getBreakpoint() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    return state.getCurrentBreakpointName();
};

bool HybridUnistylesRuntime::getRtl() {
    return this->_nativePlatform->getPrefersRtlDirection();
}

Insets HybridUnistylesRuntime::getInsets() {
    return this->_nativePlatform->getInsets();
};

Orientation HybridUnistylesRuntime::getOrientation() {
    auto orientation = this->_nativePlatform->getOrientation();

    return static_cast<Orientation>(orientation);
};

double HybridUnistylesRuntime::getPixelRatio() {
    return this->_nativePlatform->getPixelRatio();
};

double HybridUnistylesRuntime::getFontScale() {
    return this->_nativePlatform->getFontScale();
};

std::unordered_map<std::string, double> HybridUnistylesRuntime::getBreakpoints() {
    auto& state = core::UnistylesRegistry::get().getState(*_rt);
    auto sortedBreakpointPairs = state.getSortedBreakpointPairs();
    std::unordered_map<std::string, double> breakpoints{};

    std::for_each(sortedBreakpointPairs.begin(), sortedBreakpointPairs.end(), [&breakpoints](std::pair<std::string, double>& pair){
        breakpoints[pair.first] = pair.second;
    });

    return breakpoints;
}

void HybridUnistylesRuntime::setTheme(const std::string &themeName) {
    helpers::assertThat(*_rt, !this->getHasAdaptiveThemes(), "Unistyles: You're trying to set theme to: '" + themeName + "', but adaptiveThemes are enabled.");

    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    state.setTheme(themeName);
    this->_onDependenciesChange({UnistyleDependency::THEME, UnistyleDependency::THEMENAME});
};

void HybridUnistylesRuntime::setAdaptiveThemes(bool isEnabled) {
    auto& registry = core::UnistylesRegistry::get();

    std::vector<UnistyleDependency> changedDependencies{};

    changedDependencies.reserve(3);

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
    this->calculateNewThemeAndDependencies(changedDependencies);
    this->_onDependenciesChange(changedDependencies);
};

void HybridUnistylesRuntime::calculateNewThemeAndDependencies(std::vector<UnistyleDependency>& changedDependencies) {
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
}

jsi::Value HybridUnistylesRuntime::getTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count <= 1, "UnistylesRuntime.getTheme expected to be called with 0 or 1 argument.");

    auto& state = core::UnistylesRegistry::get().getState(*_rt);

    if (count == 1) {
        if (args[0].isUndefined()) {
            return state.getCurrentJSTheme();
        }

        helpers::assertThat(rt, args[0].isString(), "UnistylesRuntime.getTheme expected to be called with string.");

        auto themeName = args[0].asString(rt).utf8(rt);

        helpers::assertThat(rt, state.hasTheme(themeName), "Unistyles: You're trying to get theme '" + themeName + "' but it wasn't registered.");

        return state.getJSThemeByName(themeName);
    }

    return state.getCurrentJSTheme();
}

jsi::Value HybridUnistylesRuntime::updateTheme(jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count) {
    helpers::assertThat(rt, count == 2, "UnistylesRuntime.updateTheme expected to be called with 2 arguments.");
    helpers::assertThat(rt, args[0].isString(), "UnistylesRuntime.updateTheme expected first argument to be a string.");
    helpers::assertThat(rt, args[1].isObject(), "UnistylesRuntime.updateTheme expected first argument to be a function.");

    auto& registry = core::UnistylesRegistry::get();
    auto themeName = args[0].asString(rt).utf8(rt);

    helpers::assertThat(rt, args[1].asObject(rt).isFunction(rt), "UnistylesRuntime.updateTheme expected second argument to be a function.");

    registry.updateTheme(rt, themeName, args[1].asObject(rt).asFunction(rt));

    this->_onDependenciesChange({UnistyleDependency::THEME});

    return jsi::Value::undefined();
}

void HybridUnistylesRuntime::setImmersiveMode(bool isEnabled) {
    this->_nativePlatform->setImmersiveMode(isEnabled);
};

void HybridUnistylesRuntime::setRootViewBackgroundColor(double color) {
    this->_nativePlatform->setRootViewBackgroundColor(color);
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
    UnistylesNativeMiniRuntime nativeMiniRuntime = this->_nativePlatform->getMiniRuntime();
    UnistylesCxxMiniRuntime cxxMiniRuntime{
        this->getThemeName(),
        this->getBreakpoint(),
        this->getHasAdaptiveThemes(),
        nativeMiniRuntime.colorScheme,
        nativeMiniRuntime.screen,
        nativeMiniRuntime.contentSizeCategory,
        nativeMiniRuntime.insets,
        nativeMiniRuntime.pixelRatio,
        nativeMiniRuntime.fontScale,
        nativeMiniRuntime.rtl,
        nativeMiniRuntime.statusBar,
        nativeMiniRuntime.navigationBar,
        nativeMiniRuntime.isPortrait,
        nativeMiniRuntime.isLandscape
    };

    return cxxMiniRuntime;
}

UnistylesCxxMiniRuntime HybridUnistylesRuntime::buildMiniRuntimeFromNativeRuntime(UnistylesNativeMiniRuntime& nativeMiniRuntime) {
    UnistylesCxxMiniRuntime cxxMiniRuntime{
        this->getThemeName(),
        this->getBreakpoint(),
        this->getHasAdaptiveThemes(),
        nativeMiniRuntime.colorScheme,
        nativeMiniRuntime.screen,
        nativeMiniRuntime.contentSizeCategory,
        nativeMiniRuntime.insets,
        nativeMiniRuntime.pixelRatio,
        nativeMiniRuntime.fontScale,
        nativeMiniRuntime.rtl,
        nativeMiniRuntime.statusBar,
        nativeMiniRuntime.navigationBar,
        nativeMiniRuntime.isPortrait,
        nativeMiniRuntime.isLandscape
    };

    return cxxMiniRuntime;
}

jsi::Value HybridUnistylesRuntime::getMiniRuntimeAsValue(jsi::Runtime& rt, std::optional<UnistylesNativeMiniRuntime> maybeMiniRuntime) {
    jsi::Object obj(rt);
    auto miniRuntime = maybeMiniRuntime.has_value()
        ? this->buildMiniRuntimeFromNativeRuntime(maybeMiniRuntime.value())
        : this->getMiniRuntime();

    // auto generated by nitro, but can't be accessed due to static inline function
    obj.setProperty(rt, "themeName", JSIConverter<std::optional<std::string>>::toJSI(rt, miniRuntime.themeName));
    obj.setProperty(rt, "breakpoint", JSIConverter<std::optional<std::string>>::toJSI(rt, miniRuntime.breakpoint));
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
    obj.setProperty(rt, "isPortrait", JSIConverter<bool>::toJSI(rt, miniRuntime.isPortrait));
    obj.setProperty(rt, "isLandscape", JSIConverter<bool>::toJSI(rt, miniRuntime.isLandscape));

    return obj;
}

void HybridUnistylesRuntime::registerPlatformListener(const std::function<void (std::vector<UnistyleDependency>)>& listener) {
    this->_onDependenciesChange = listener;
}

void HybridUnistylesRuntime::registerNativePlatformListener(const std::function<void(std::vector<UnistyleDependency>, UnistylesNativeMiniRuntime)>& listener) {
    this->_nativePlatform->registerPlatformListener(listener);
    this->_onNativeDependenciesChange = listener;
}

void HybridUnistylesRuntime::registerImeListener(const std::function<void(UnistylesNativeMiniRuntime)>& listener) {
    this->_nativePlatform->registerImeListener(listener);
}

void HybridUnistylesRuntime::unregisterNativePlatformListeners() {
    this->_nativePlatform->unregisterPlatformListeners();
}

void HybridUnistylesRuntime::includeDependenciesForColorSchemeChange(std::vector<UnistyleDependency>& deps) {
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(*this->_rt);

    // ignore color scheme changes if user has no adaptive themes
    if (!state.hasAdaptiveThemes()) {
        return;
    }

    this->calculateNewThemeAndDependencies(deps);
}

jsi::Runtime& HybridUnistylesRuntime::getRuntime() {
    return *this->_rt;
}
