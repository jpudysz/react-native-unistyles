#include "UnistylesState.h"
#include "UnistylesRegistry.h"

using namespace margelo::nitro::unistyles;

bool core::UnistylesState::hasAdaptiveThemes() {
    if (!this->_prefersAdaptiveThemes.has_value() || !this->_prefersAdaptiveThemes.value()) {
        return false;
    }

    return helpers::vecContainsKeys(this->_registeredThemeNames, {"light", "dark"});
}

void core::UnistylesState::setTheme(std::string themeName) {
    helpers::assertThat(*_rt, helpers::vecContainsKeys(this->_registeredThemeNames, {themeName}), "Unistyles: You're trying to set theme to: '" + std::string(themeName) + "', but it wasn't registered.");

    if (themeName != this->_currentThemeName) {
        this->_currentThemeName = themeName;
    }
}

std::optional<std::string>& core::UnistylesState::getCurrentThemeName() {
    return this->_currentThemeName;
}

jsi::Object core::UnistylesState::getCurrentJSTheme() {
    auto hasSomeThemes = _registeredThemeNames.size() > 0;

    // return empty object, if user didn't register any themes
    if (!hasSomeThemes) {
        return jsi::Object(*_rt);
    }

    helpers::assertThat(*_rt, _currentThemeName.has_value(), "Unistyles: One of your stylesheets is trying to get the theme, but no theme has been selected yet. Did you forget to select an initial theme?");

    auto it = this->_jsThemes.find(_currentThemeName.value());

    helpers::assertThat(*_rt, it != this->_jsThemes.end(), "Unistyles: You're trying to get theme '" + _currentThemeName.value() + "', but it was not registered. Did you forget to register it with StyleSheet.configure?");

    auto maybeTheme = it->second.lock(*_rt);

    helpers::assertThat(*_rt, maybeTheme.isObject(), "Unistyles: Unable to retrieve your theme from C++ as it has already been garbage collected, likely due to multiple hot reloads. Please live reload the app.");

    return maybeTheme.asObject(*_rt);
}

jsi::Object core::UnistylesState::getJSThemeByName(std::string& themeName) {
    auto it = this->_jsThemes.find(themeName);

    helpers::assertThat(*_rt, it != this->_jsThemes.end(), "Unistyles: You're trying to get theme '" + themeName + "', but it was not registered. Did you forget to register it with StyleSheet.configure?");

    auto maybeTheme = it->second.lock(*_rt);

    helpers::assertThat(*_rt, maybeTheme.isObject(), "Unistyles: Unable to retrieve your theme from C++ as it has already been garbage collected, likely due to multiple hot reloads. Please live reload the app.");

    return maybeTheme.asObject(*_rt);
}

void core::UnistylesState::computeCurrentBreakpoint(int screenWidth) {
    this->_currentBreakpointName = helpers::getBreakpointFromScreenWidth(
        screenWidth,
        this->_sortedBreakpointPairs
    );
}

bool core::UnistylesState::hasTheme(std::string themeName) {
    return helpers::vecContainsKeys(this->_registeredThemeNames, {themeName});
}

bool core::UnistylesState::hasInitialTheme() {
    return this->_initialThemeName.has_value();
}

std::vector<std::string> core::UnistylesState::getRegisteredThemeNames() {
    return std::vector<std::string>(this->_registeredThemeNames);
}

std::vector<std::pair<std::string, double>> core::UnistylesState::getSortedBreakpointPairs() {
    return std::vector<std::pair<std::string, double>>(this->_sortedBreakpointPairs);
}

std::optional<std::string> core::UnistylesState::getInitialTheme() {
    return this->_initialThemeName;
}

std::optional<std::string> core::UnistylesState::getCurrentBreakpointName() {
    return this->_currentBreakpointName;
}

bool core::UnistylesState::getPrefersAdaptiveThemes() {
    return this->_prefersAdaptiveThemes.has_value() && this->_prefersAdaptiveThemes.value();
}

void core::UnistylesState::registerProcessColorFunction(jsi::Function&& fn) {
    this->_processColorFn = std::make_shared<jsi::Function>(std::move(fn));
}

int core::UnistylesState::parseColor(jsi::Value& maybeColor) {
    if (!maybeColor.isString()) {
        return 0;
    }
    
    auto colorString = maybeColor.asString(*_rt);
    
    if (!this->_colorCache.contains(colorString.utf8(*_rt).c_str())) {
        // we must convert it to uint32_t first, otherwise color will be broken
        uint32_t color = this->_processColorFn.get()->call(*_rt, colorString).asNumber();
        
        this->_colorCache[colorString.utf8(*_rt).c_str()] = color ? color : 0;
    }
    
    return this->_colorCache[colorString.utf8(*_rt).c_str()];
}
