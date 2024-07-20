#include "UnistylesRuntime.h"
#include <jsi/jsi.h>

using namespace facebook;

jsi::Value UnistylesRuntime::getScreenWidth(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(this->screen.width);
}

jsi::Value UnistylesRuntime::getScreenHeight(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(this->screen.height);
}

jsi::Value UnistylesRuntime::getContentSizeCategory(jsi::Runtime & rt, std::string fnName) {
    return jsi::Value(jsi::String::createFromUtf8(rt, this->contentSizeCategory));
}

jsi::Value UnistylesRuntime::hasEnabledAdaptiveThemes(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(this->hasAdaptiveThemes);
}

jsi::Value UnistylesRuntime::getThemeName(jsi::Runtime& rt, std::string fnName) {
    return !this->themeName.empty()
        ? jsi::Value(jsi::String::createFromUtf8(rt, this->themeName))
        : this->getThemeOrFail(rt);
}

jsi::Value UnistylesRuntime::getCurrentBreakpoint(jsi::Runtime& rt, std::string fnName) {
    return !this->breakpoint.empty()
        ? jsi::Value(jsi::String::createFromUtf8(rt, this->breakpoint))
        : jsi::Value::undefined();
}

jsi::Value UnistylesRuntime::getColorScheme(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(jsi::String::createFromUtf8(rt, this->colorScheme));
}

jsi::Value UnistylesRuntime::getSortedBreakpointPairs(jsi::Runtime& rt, std::string fnName) {
    std::unique_ptr<jsi::Array> sortedBreakpointEntriesArray = std::make_unique<jsi::Array>(rt, this->sortedBreakpointPairs.size());

    for (size_t i = 0; i < this->sortedBreakpointPairs.size(); ++i) {
        std::unique_ptr<jsi::Array> pairArray = std::make_unique<jsi::Array>(rt, 2);
        jsi::String nameValue = jsi::String::createFromUtf8(rt, this->sortedBreakpointPairs[i].first);

        pairArray->setValueAtIndex(rt, 0, nameValue);
        pairArray->setValueAtIndex(rt, 1, jsi::Value(this->sortedBreakpointPairs[i].second));
        sortedBreakpointEntriesArray->setValueAtIndex(rt, i, *pairArray);
    }

    return jsi::Value(rt, *sortedBreakpointEntriesArray);
}

jsi::Value UnistylesRuntime::setBreakpoints(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        jsi::Object breakpointsObj = arguments[0].asObject(rt);
        auto sortedBreakpoints = this->toSortedBreakpointPairs(rt, breakpointsObj);

        if (sortedBreakpoints.size() == 0) {
            throw jsi::JSError(rt, UnistylesErrorBreakpointsCannotBeEmpty);
        }

        if (sortedBreakpoints.at(0).second != 0) {
            throw jsi::JSError(rt, UnistylesErrorBreakpointsMustStartFromZero);
        }

        this->sortedBreakpointPairs = sortedBreakpoints;

        std::string breakpoint = this->getBreakpointFromScreenWidth(this->screen.width, sortedBreakpoints);

        this->breakpoint = breakpoint;

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::setActiveTheme(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        std::string themeName = arguments[0].asString(rt).utf8(rt);

        if (this->themeName != themeName) {
            this->themeName = themeName;
            this->onThemeChange(themeName);
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::updateTheme(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        std::string themeName = arguments[0].asString(rt).utf8(rt);

        if (this->themeName == themeName) {
            this->onThemeChange(themeName);
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::useAdaptiveThemes(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        bool enableAdaptiveThemes = arguments[0].asBool();

        if (enableAdaptiveThemes && this->colorScheme == UnistylesUnspecifiedScheme) {
            throw jsi::JSError(rt, UnistylesErrorAdaptiveThemesNotSupported);
        }

        this->hasAdaptiveThemes = enableAdaptiveThemes;

        if (!enableAdaptiveThemes || !this->supportsAutomaticColorScheme) {
            return jsi::Value::undefined();
        }

        if (this->themeName != this->colorScheme) {
            this->themeName = this->colorScheme;
            this->onThemeChange(this->themeName);
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::addPlugin(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        std::string pluginName = arguments[0].asString(rt).utf8(rt);
        bool notify = arguments[1].asBool();

        this->pluginNames.push_back(pluginName);

        // registry enabled plugins won't notify listeners
        if (notify) {
            this->onPluginChange();
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::removePlugin(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        std::string pluginName = arguments[0].asString(rt).utf8(rt);

        auto it = std::find(this->pluginNames.begin(), this->pluginNames.end(), pluginName);

        if (it != this->pluginNames.end()) {
            this->pluginNames.erase(it);
            this->onPluginChange();
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::getEnabledPlugins(jsi::Runtime& rt, std::string fnName) {
    auto jsiArray = facebook::jsi::Array(rt, this->pluginNames.size());

    for (size_t i = 0; i < this->pluginNames.size(); i++) {
        jsiArray.setValueAtIndex(rt, i, facebook::jsi::String::createFromUtf8(rt, this->pluginNames[i]));
    }

    return jsiArray;
}

jsi::Value UnistylesRuntime::getInsets(jsi::Runtime& rt, std::string fnName) {
    auto insets = jsi::Object(rt);

    insets.setProperty(rt, "top", this->insets.top);
    insets.setProperty(rt, "bottom", this->insets.bottom);
    insets.setProperty(rt, "left", this->insets.left);
    insets.setProperty(rt, "right", this->insets.right);

    return insets;
}

jsi::Value UnistylesRuntime::getStatusBar(jsi::Runtime& rt, std::string fnName) {
    auto statusBar = jsi::Object(rt);
    auto setStatusBarColorFunction = HOST_FN("setColor", 1, {
        std::string color = arguments[0].asString(rt).utf8(rt);
        float alpha = arguments[1].asNumber();

        if (this->setStatusBarColor.has_value()) {
            this->setStatusBarColor.value()(color, alpha);
        }

        return jsi::Value::undefined();
    });
    auto setStatusBarHiddenFunction = HOST_FN("setHidden", 1, {
        bool hidden = arguments[0].asBool();

        if (this->setStatusBarHidden.has_value()) {
            this->setStatusBarHidden.value()(hidden);
        }

        return jsi::Value::undefined();
    });

    statusBar.setProperty(rt, "width", this->statusBar.width);
    statusBar.setProperty(rt, "height", this->statusBar.height);
    statusBar.setProperty(rt, "setColor", setStatusBarColorFunction);
    statusBar.setProperty(rt, "setHidden", setStatusBarHiddenFunction);

    return statusBar;
}

jsi::Value UnistylesRuntime::getNavigationBar(jsi::Runtime& rt, std::string fnName) {
    auto navigationBarValue = jsi::Object(rt);
    auto setNavigationBarColorFunction = HOST_FN("setColor", 1, {
        std::string color = arguments[0].asString(rt).utf8(rt);
        float alpha = arguments[1].asNumber();

        if (this->setNavigationBarColor.has_value()) {
            this->setNavigationBarColor.value()(color, alpha);
        }

        return jsi::Value::undefined();
    });
    auto setHiddenFunction = HOST_FN("setHidden", 1, {
        bool hidden = arguments[0].asBool();

        if (this->setNavigationBarHidden.has_value()) {
            this->setNavigationBarHidden.value()(hidden);
        }

        return jsi::Value::undefined();
    });

    navigationBarValue.setProperty(rt, "width", this->navigationBar.width);
    navigationBarValue.setProperty(rt, "height", this->navigationBar.height);
    navigationBarValue.setProperty(rt, "setColor", setNavigationBarColorFunction);
    navigationBarValue.setProperty(rt, "setHidden", setHiddenFunction);

    return navigationBarValue;
}

jsi::Value UnistylesRuntime::getPixelRatio(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(roundf(this->pixelRatio * 100)/ 100);
}

jsi::Value UnistylesRuntime::getFontScale(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(roundf(this->fontScale * 100) / 100);
}

std::optional<jsi::Value> UnistylesRuntime::setThemes(jsi::Runtime& rt, const jsi::Value& value) {
    jsi::Array themes = value.asObject(rt).asArray(rt);
    std::vector<std::string> themesVector;
    size_t length = themes.size(rt);

    for (size_t i = 0; i < length; ++i) {
        jsi::Value element = themes.getValueAtIndex(rt, i);

        if (element.isString()) {
            std::string theme = element.asString(rt).utf8(rt);
            themesVector.push_back(theme);
        }
    }

    if (themesVector.size() == 0) {
        throw jsi::JSError(rt, UnistylesErrorThemesCannotBeEmpty);
    }

    this->themes = themesVector;
    this->themeName = "";

    bool hasLightTheme = std::find(themesVector.begin(), themesVector.end(), "light") != themesVector.end();
    bool hasDarkTheme = std::find(themesVector.begin(), themesVector.end(), "dark") != themesVector.end();

    this->supportsAutomaticColorScheme = hasLightTheme && hasDarkTheme;

    return std::nullopt;
}

jsi::Value UnistylesRuntime::setImmersiveModeEnabled(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        bool enabled = arguments[0].asBool();

        if (this->setImmersiveMode.has_value()) {
            this->setImmersiveMode.value()(enabled);
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::setRootBackgroundColor(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        std::string color = arguments[0].asString(rt).utf8(rt);
        float alpha = arguments[1].asNumber();

        if (this->setRootViewBackgroundColor.has_value()) {
            this->setRootViewBackgroundColor.value()(color, alpha);
        }

        return jsi::Value::undefined();
    });
}

jsi::Value UnistylesRuntime::getIsRtl(jsi::Runtime& rt, std::string fnName) {
    return jsi::Value(this->rtl);
}
