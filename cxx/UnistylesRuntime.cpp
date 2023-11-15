#include "UnistylesRuntime.h"

#include <string>
#include <vector>

#pragma region HostObject

std::vector<jsi::PropNameID> UnistylesRuntime::getPropertyNames(jsi::Runtime& runtime) {
    std::vector<jsi::PropNameID> properties;

    // getters
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("screenWidth")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("screenHeight")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("hasAdaptiveThemes")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("themeName")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("breakpoint")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("colorScheme")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("sortedBreakpointPairs")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("useBreakpoints")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("useTheme")));
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("useAdaptiveThemes")));

    // setters
    properties.push_back(jsi::PropNameID::forUtf8(runtime, std::string("themes")));

    return properties;
}


jsi::Value UnistylesRuntime::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
    std::string propName = propNameId.utf8(runtime);

    if (propName == "screenWidth") {
        return jsi::Value(this->screenWidth);
    }

    if (propName == "screenHeight") {
        return jsi::Value(this->screenHeight);
    }

    if (propName == "hasAdaptiveThemes") {
        return jsi::Value(this->hasAdaptiveThemes);
    }

    if (propName == "themeName") {
        return !this->themeName.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->themeName))
            : this->getThemeOrFail(runtime);
    }

    if (propName == "breakpoint") {
        return !this->breakpoint.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->breakpoint))
            : jsi::Value::undefined();
    }

    if (propName == "colorScheme") {
        return jsi::Value(jsi::String::createFromUtf8(runtime, this->colorScheme));
    }

    if (propName == "sortedBreakpointPairs") {
        std::unique_ptr<jsi::Array> sortedBreakpointEntriesArray = std::make_unique<jsi::Array>(runtime, this->sortedBreakpointPairs.size());

        for (size_t i = 0; i < this->sortedBreakpointPairs.size(); ++i) {
            std::unique_ptr<jsi::Array> pairArray = std::make_unique<jsi::Array>(runtime, 2);
            jsi::String nameValue = jsi::String::createFromUtf8(runtime, this->sortedBreakpointPairs[i].first);

            pairArray->setValueAtIndex(runtime, 0, nameValue);
            pairArray->setValueAtIndex(runtime, 1, jsi::Value(this->sortedBreakpointPairs[i].second));
            sortedBreakpointEntriesArray->setValueAtIndex(runtime, i, *pairArray);
        }

        return jsi::Value(runtime, *sortedBreakpointEntriesArray);
    }

    if (propName == "useBreakpoints") {
        return jsi::Function::createFromHostFunction(
            runtime,
            jsi::PropNameID::forAscii(runtime, "useBreakpoints"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                jsi::Object breakpointsObj = arguments[0].asObject(runtime);
                jsi::Array propertyNames = breakpointsObj.getPropertyNames(runtime);
                std::vector<std::pair<std::string, double>> sortedBreakpointEntriesVec;

                for (size_t i = 0; i < propertyNames.size(runtime); ++i) {
                    jsi::Value propNameValue = propertyNames.getValueAtIndex(runtime, i);
                    std::string name = propNameValue.asString(runtime).utf8(runtime);
                    jsi::PropNameID propNameID = jsi::PropNameID::forUtf8(runtime, name);
                    jsi::Value value = breakpointsObj.getProperty(runtime, propNameID);

                    if (value.isNumber()) {
                        double breakpointValue = value.asNumber();
                        sortedBreakpointEntriesVec.push_back(std::make_pair(name, breakpointValue));
                    }
                }

                std::sort(sortedBreakpointEntriesVec.begin(), sortedBreakpointEntriesVec.end(), [](const std::pair<std::string, double>& a, const std::pair<std::string, double>& b) {
                    return a.second < b.second;
                });

                if (sortedBreakpointEntriesVec.size() == 0) {
                    throw jsi::JSError(runtime, UnistylesErrorBreakpointsCannotBeEmpty);
                }

                if (sortedBreakpointEntriesVec.at(0).second != 0) {
                    throw jsi::JSError(runtime, UnistylesErrorBreakpointsMustStartFromZero);
                }

                this->sortedBreakpointPairs = sortedBreakpointEntriesVec;

                std::string breakpoint = this->getBreakpointFromScreenWidth(this->screenWidth, sortedBreakpointEntriesVec);

                this->breakpoint = breakpoint;

                return jsi::Value::undefined();
            }
        );
    }

    if (propName == "useTheme") {
        return jsi::Function::createFromHostFunction(runtime,
            jsi::PropNameID::forAscii(runtime, "useTheme"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                std::string themeName = arguments[0].asString(runtime).utf8(runtime);

                this->themeName = themeName;
                this->onThemeChange(themeName);

                return jsi::Value::undefined();
            }
        );
    }

    if (propName == "useAdaptiveThemes") {
        return jsi::Function::createFromHostFunction(runtime,
            jsi::PropNameID::forAscii(runtime, "useAdaptiveThemes"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                bool enableAdaptiveThemes = arguments[0].asBool();

                this->hasAdaptiveThemes = enableAdaptiveThemes;

                if (!enableAdaptiveThemes || !this->supportsAutomaticColorScheme) {
                    return jsi::Value::undefined();
                }

                this->themeName = this->colorScheme;
                this->onThemeChange(this->themeName);

                return jsi::Value::undefined();
            }
        );
    }

    return jsi::Value::undefined();
}

void UnistylesRuntime::set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) {
    std::string propName = propNameId.utf8(runtime);

    if (propName == "themes" && value.isObject()) {
        jsi::Array themes = value.asObject(runtime).asArray(runtime);
        std::vector<std::string> themesVector;
        size_t length = themes.size(runtime);

        for (size_t i = 0; i < length; ++i) {
            jsi::Value element = themes.getValueAtIndex(runtime, i);

            if (element.isString()) {
                std::string theme = element.asString(runtime).utf8(runtime);
                themesVector.push_back(theme);
            }
        }

        if (themesVector.size() == 0) {
            throw jsi::JSError(runtime, UnistylesErrorThemesCannotBeEmpty);
        }

        this->themes = themesVector;
        this->themeName = "";

        bool hasLightTheme = std::find(themesVector.begin(), themesVector.end(), "light") != themesVector.end();
        bool hasDarkTheme = std::find(themesVector.begin(), themesVector.end(), "dark") != themesVector.end();

        this->supportsAutomaticColorScheme = hasLightTheme && hasDarkTheme;

        return;
    }
}

#pragma endregion
#pragma region Helpers

std::string UnistylesRuntime::getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointPairs) {
    for (size_t i = 0; i < sortedBreakpointPairs.size(); ++i) {
        const auto& [key, value] = sortedBreakpointPairs[i];
        const double maxVal = (i + 1 < sortedBreakpointPairs.size()) ? sortedBreakpointPairs[i + 1].second : std::numeric_limits<double>::infinity();

        if (width >= value && width < maxVal) {
            return key;
        }
    }

    return sortedBreakpointPairs.empty() ? "" : sortedBreakpointPairs.back().first;
}

void UnistylesRuntime::handleScreenSizeChange(int width, int height) {
    std::string breakpoint = this->getBreakpointFromScreenWidth(width, this->sortedBreakpointPairs);

    this->breakpoint = breakpoint;
    this->screenWidth = width;
    this->screenHeight = height;

    int orientation = width > height
        ? UnistylesOrientationLandscape
        : UnistylesOrientationPortrait;

    this->onBreakpointChange(breakpoint, orientation, width, height);
}

void UnistylesRuntime::handleAppearanceChange(std::string colorScheme) {
    this->colorScheme = colorScheme;

    if (!this->supportsAutomaticColorScheme || !this->hasAdaptiveThemes) {
        return;
    }

    // don't emit even when selecting initial theme
//    if (!this->themeName.empty()) {
//        this->onThemeChange(this->colorScheme);
//    }
    this->onThemeChange(this->colorScheme);

    this->themeName = this->colorScheme;
}

jsi::Value UnistylesRuntime::getThemeOrFail(jsi::Runtime& runtime) {
    if (this->themes.size() == 1) {
        std::string themeName = this->themes.at(0);

        this->themeName = themeName;

        return jsi::String::createFromUtf8(runtime, themeName);
    }

    return jsi::Value().undefined();
}

#pragma endregion
