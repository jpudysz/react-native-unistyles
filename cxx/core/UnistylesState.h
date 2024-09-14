#pragma once

#include <jsi/jsi.h>
#include "Helpers.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

struct UnistylesState {
    UnistylesState(jsi::Runtime& rt): _rt{&rt} {}
    
    bool hasAdaptiveThemes = false;
    bool prefersAdaptiveThemes = false;
    std::optional<std::string> currentThemeName = std::nullopt;
    std::optional<std::string> currentBreakpointName = std::nullopt;
    
    void updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback);
    
private:
    jsi::Runtime* _rt;
    std::unordered_map<std::string, jsi::WeakObject> _jsThemes{};
};

}
