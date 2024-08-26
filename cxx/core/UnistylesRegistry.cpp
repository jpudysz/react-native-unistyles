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
