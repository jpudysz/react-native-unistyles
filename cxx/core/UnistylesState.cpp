#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

bool core::UnistylesState::hasAdaptiveThemes() {
    if (!this->prefersAdaptiveThemes.has_value() || !this->prefersAdaptiveThemes.value()) {
        return false;
    }

    return helpers::vecContainsKeys(this->registeredThemeNames, {"light", "dark"});
}

void core::UnistylesState::setTheme(std::string themeName) {
    helpers::assertThat(*_rt, helpers::vecContainsKeys(this->registeredThemeNames, {themeName}), "You're trying to set theme to: '" + std::string(themeName) + "', but it wasn't registered.");

    if (themeName != this->currentThemeName) {
        this->currentThemeName = themeName;
    }
}

std::optional<std::string>& core::UnistylesState::getCurrentThemeName() {
    return this->currentThemeName;
}

jsi::Object core::UnistylesState::getJSTheme() {
    auto hasSomeThemes = registeredThemeNames.size() > 0;

    // return empty object, if user didn't register any themes
    if (!hasSomeThemes) {
        return jsi::Object(*_rt);
    }

    // check if user provided a callback to get initial theme name
    if (this->getInitialThemeNameFn.has_value()) {
        auto result = this->getInitialThemeNameFn.value().call(*_rt);

        helpers::assertThat(*_rt, result.isString(), "initialTheme resolved from function is not a string. Please check your initialTheme function.");

        this->currentThemeName = result.asString(*_rt).utf8(*_rt);
        this->getInitialThemeNameFn = std::nullopt;
    }

    helpers::assertThat(*_rt, currentThemeName.has_value(), "one of your stylesheets is trying to get the theme, but no theme has been selected yet. Did you forget to select an initial theme?");

    auto it = this->_jsThemes.find(currentThemeName.value());

    helpers::assertThat(*_rt, it != this->_jsThemes.end(), "you're trying to get theme '" + currentThemeName.value() + "', but it was not registered. Did you forget to register it with StyleSheet.configure?");

    auto maybeTheme = it->second.lock(*_rt);

    helpers::assertThat(*_rt, maybeTheme.isObject(), "unable to get your theme from C++. It was already garbage collected.");

    return maybeTheme.asObject(*_rt);
}

void core::UnistylesState::computeCurrentBreakpoint(int screenWidth) {
    this->currentBreakpointName = helpers::getBreakpointFromScreenWidth(
        screenWidth,
        this->sortedBreakpointPairs
    );
}

bool core::UnistylesState::hasTheme(std::string themeName) {
    return helpers::vecContainsKeys(this->registeredThemeNames, {themeName});
}

bool core::UnistylesState::hasInitialTheme() {
    return this->initialThemeName.has_value();
}

std::vector<std::string> core::UnistylesState::getRegisteredThemeNames() {
    return std::vector<std::string>(this->registeredThemeNames);
}

std::vector<std::pair<std::string, double>> core::UnistylesState::getSortedBreakpointPairs() {
    return std::vector<std::pair<std::string, double>>(this->sortedBreakpointPairs);
}

std::optional<std::string> core::UnistylesState::getInitialTheme() {
    return this->initialThemeName;
}

std::optional<std::string> core::UnistylesState::getCurrentBreakpointName() {
    return this->currentBreakpointName;
}

bool core::UnistylesState::getPrefersAdaptiveThemes() {
    return this->prefersAdaptiveThemes.has_value() && this->prefersAdaptiveThemes.value();
}

void core::UnistylesState::registerTheme(jsi::Runtime& rt, std::string name, jsi::Object&& theme) {
    this->_jsThemes.emplace(name, jsi::WeakObject(rt, std::move(theme)));
    this->registeredThemeNames.push_back(name);
}

void core::UnistylesState::registerBreakpoints(std::vector<std::pair<std::string, double>>& sortedBreakpoints) {
    this->sortedBreakpointPairs = std::move(sortedBreakpoints);
}

void core::UnistylesState::setPrefersAdaptiveThemes(bool prefersAdaptiveThemes) {
    this->prefersAdaptiveThemes = prefersAdaptiveThemes;
}

void core::UnistylesState::setInitialThemeName(std::string themeName) {
    this->initialThemeName = themeName;
}

void core::UnistylesState::setInitialThemeNameCallback(jsi::Function&& getInitialThemeNameFn) {
    this->getInitialThemeNameFn = std::move(getInitialThemeNameFn);
}

void core::UnistylesState::updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback) {
    auto it = this->_jsThemes.find(themeName);
    
    helpers::assertThat(rt, it != this->_jsThemes.end(), "you're trying to update theme '" + themeName + "' but it wasn't registered.");
    
    auto currentThemeValue = it->second.lock(rt);
    
    helpers::assertThat(rt, currentThemeValue.isObject(), "unable to update your theme from C++. It was already garbage collected.");
    
    auto result = callback.call(rt, currentThemeValue.asObject(rt));
    
    helpers::assertThat(rt, result.isObject(), "returned theme is not an object. Please check your updateTheme function.");

    it->second = jsi::WeakObject(rt, result.asObject(rt));
}
