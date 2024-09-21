#pragma once

#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>
#include <unordered_map>
#include <unordered_set>
#include "Breakpoints.h"
#include "StyleSheet.h"
#include "Unistyle.h"

namespace margelo::nitro::unistyles::core {

struct UnistylesState;

using namespace facebook;
using namespace facebook::react;

struct UnistylesRegistry {
    static UnistylesRegistry& get();
    
    UnistylesRegistry(const UnistylesRegistry&) = delete;
    UnistylesRegistry(const UnistylesRegistry&&) = delete;
    
    void registerTheme(jsi::Runtime& rt, std::string name, jsi::Object&& theme);
    void registerBreakpoints(jsi::Runtime& rt, std::vector<std::pair<std::string, double>>& sortedBreakpoints);
    void setPrefersAdaptiveThemes(jsi::Runtime& rt, bool prefersAdaptiveThemes);
    void setInitialThemeName(jsi::Runtime& rt, std::string themeName);
    void updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback);
    
    UnistylesState& getState(jsi::Runtime& rt);
    void createState(jsi::Runtime& rt);
    void linkShadowNodeWithUnistyle(const ShadowNodeFamily*, const core::Unistyle::Shared);
    void unlinkShadowNodeWithUnistyle(const ShadowNodeFamily*, const core::Unistyle::Shared);
    
private:
    UnistylesRegistry() = default;

    std::unordered_map<jsi::Runtime*, UnistylesState> _states{};
    std::vector<core::StyleSheet> _styleSheetRegistry{};
    std::unordered_map<const ShadowNodeFamily*, std::vector<core::Unistyle::Shared>> _shadowRegistry{};
};

UnistylesRegistry& UnistylesRegistry::get() {
    static UnistylesRegistry cache;
    
    return cache;
}

}
