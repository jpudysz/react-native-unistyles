#include "UnistylesState.h"
#include "UnistylesRegistry.h"

using namespace margelo::nitro::unistyles;

bool core::UnistylesState::hasAdaptiveThemes() {
    if (!this->prefersAdaptiveThemes.has_value() || !this->prefersAdaptiveThemes.value()) {
        return false;
    }

    return helpers::vecContainsKeys(this->registeredThemeNames, {"light", "dark"});
}

void core::UnistylesState::setTheme(std::string themeName) {
    helpers::assertThat(*rt, helpers::vecContainsKeys(this->registeredThemeNames, {themeName}), "You're trying to set theme to: '" + std::string(themeName) + "', but it wasn't registered.");

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
        return jsi::Object(*rt);
    }

    // check if user provided a callback to get initial theme name
    if (this->getInitialThemeNameFn.has_value()) {
        auto result = this->getInitialThemeNameFn.value().call(*rt);

        helpers::assertThat(*rt, result.isString(), "initialTheme resolved from function is not a string. Please check your initialTheme function.");

        this->currentThemeName = result.asString(*rt).utf8(*rt);
        this->getInitialThemeNameFn = std::nullopt;
    }

    helpers::assertThat(*rt, currentThemeName.has_value(), "one of your stylesheets is trying to get the theme, but no theme has been selected yet. Did you forget to select an initial theme?");

    auto& state = core::UnistylesRegistry::get().getState(*rt);
    auto it = state.jsThemes.find(currentThemeName.value());

    helpers::assertThat(*rt, it != state.jsThemes.end(), "you're trying to get theme '" + currentThemeName.value() + "', but it was not registered. Did you forget to register it with StyleSheet.configure?");

    auto maybeTheme = it->second.lock(*rt);

    helpers::assertThat(*rt, maybeTheme.isObject(), "unable to get your theme from C++. It was already garbage collected.");

    return maybeTheme.asObject(*rt);
}

jsi::Object& core::UnistylesState::getMiniRuntime() {
    return miniRuntime;
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
