#include "UnistylesRegistry.h"
#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

void core::UnistylesRegistry::registerTheme(jsi::Runtime& rt, std::string name, jsi::Object&& theme) {
    auto& state = this->getState(rt);

    state.jsThemes.emplace(name, jsi::WeakObject(rt, std::move(theme)));
    state.registeredThemeNames.push_back(name);
}

void core::UnistylesRegistry::registerBreakpoints(jsi::Runtime& rt, std::vector<std::pair<std::string, double>>& sortedBreakpoints) {
    auto& state = this->getState(rt);

    state.sortedBreakpointPairs = std::move(sortedBreakpoints);
}

void core::UnistylesRegistry::setPrefersAdaptiveThemes(jsi::Runtime& rt, bool prefersAdaptiveThemes) {
    auto& state = this->getState(rt);

    state.prefersAdaptiveThemes = prefersAdaptiveThemes;
}

void core::UnistylesRegistry::setInitialThemeName(jsi::Runtime& rt, std::string themeName) {
    auto& state = this->getState(rt);

    state.initialThemeName = themeName;
}

void core::UnistylesRegistry::setInitialThemeNameCallback(jsi::Runtime& rt, jsi::Function&& getInitialThemeNameFn) {
    auto& state = this->getState(rt);

    state.getInitialThemeNameFn = std::move(getInitialThemeNameFn);
}

core::UnistylesState& core::UnistylesRegistry::getState(jsi::Runtime& rt) {
    auto it = this->states.find(&rt);

    helpers::assertThat(rt, it != this->states.end(), "Unistyles was loaded, but it's not configured. Did you forget to call StyleSheet.configure? If you don't want to use any themes or breakpoints, simply call it with an empty object {}.");

    return it->second;
}

void core::UnistylesRegistry::createState(jsi::Runtime& rt, jsi::Object& miniRuntime) {
    auto it = this->states.find(&rt);

    // remove old state, so we can swap it with new config
    // during live reload
    if (it != this->states.end()) {
        this->states.extract(&rt);
    }

    this->states.emplace(
        std::piecewise_construct,
        std::forward_as_tuple(&rt),
        std::forward_as_tuple(rt, std::move(miniRuntime))
    );
}

void core::UnistylesRegistry::updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback) {
    auto& state = this->getState(rt);
    auto it = state.jsThemes.find(themeName);
    
    helpers::assertThat(rt, it != state.jsThemes.end(), "you're trying to update theme '" + themeName + "' but it wasn't registered.");
    
    auto currentThemeValue = it->second.lock(rt);
    
    helpers::assertThat(rt, currentThemeValue.isObject(), "unable to update your theme from C++. It was already garbage collected.");
    
    auto result = callback.call(rt, currentThemeValue.asObject(rt));
    
    helpers::assertThat(rt, result.isObject(), "returned theme is not an object. Please check your updateTheme function.");

    it->second = jsi::WeakObject(rt, result.asObject(rt));
}