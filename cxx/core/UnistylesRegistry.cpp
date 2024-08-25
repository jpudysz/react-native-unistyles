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

core::UnistylesState& core::UnistylesRegistry::getState(jsi::Runtime& rt) {
    auto it = this->states.find(&rt);
    
    helpers::assertThat(rt, it != this->states.end(), "there is no state attached for the current runtime. Did you forget to call StyleSheet.configure?");
    
    return it->second;
}

void core::UnistylesRegistry::createState(jsi::Runtime& rt, jsi::Object& miniRuntime) {
    auto it = this->states.find(&rt);
    
    if (it != this->states.end()) {
        return;
    }
    
    this->states.emplace(
        std::piecewise_construct,
        std::forward_as_tuple(&rt),
        std::forward_as_tuple(rt, std::move(miniRuntime))
    );
}
