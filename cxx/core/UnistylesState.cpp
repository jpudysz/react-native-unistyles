#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;

void core::UnistylesState::updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback) {
    auto it = this->_jsThemes.find(themeName);
    
    helpers::assertThat(rt, it != this->_jsThemes.end(), "you're trying to update theme '" + themeName + "' but it wasn't registered.");
    
    auto currentThemeValue = it->second.lock(rt);
    
    helpers::assertThat(rt, currentThemeValue.isObject(), "unable to update your theme from C++. It was already garbage collected.");
    
    auto result = callback.call(rt, currentThemeValue.asObject(rt));
    
    helpers::assertThat(rt, result.isObject(), "returned theme is not an object. Please check your updateTheme function.");

    it->second = jsi::WeakObject(rt, result.asObject(rt));
}
