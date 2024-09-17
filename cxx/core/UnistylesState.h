#pragma once

#include <jsi/jsi.h>
#include "Helpers.h"
#include "Breakpoints.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

struct UnistylesState {
    UnistylesState(jsi::Runtime& rt): _rt{&rt} {}
    UnistylesState(const UnistylesState&) = delete;
    UnistylesState(const UnistylesState&&) = delete;
    
    bool hasAdaptiveThemes();
    bool hasInitialTheme();
    bool getPrefersAdaptiveThemes();
    void setTheme(std::string themeName);
    bool hasTheme(std::string themeName);
    std::optional<std::string>& getCurrentThemeName();
    std::vector<std::string> getRegisteredThemeNames();
    std::optional<std::string> getInitialTheme();
    std::optional<jsi::Function> getInitialThemeNameFn;
    std::optional<std::string> getCurrentBreakpointName();
    std::vector<std::pair<std::string, double>> getSortedBreakpointPairs();

    std::optional<bool> prefersAdaptiveThemes;
    std::optional<std::string> initialThemeName = std::nullopt;
    std::optional<std::string> currentBreakpointName = std::nullopt;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs{};
    std::vector<std::string> registeredThemeNames{};
    std::optional<std::string> currentThemeName = std::nullopt;
    
    jsi::Object getJSTheme();
    void computeCurrentBreakpoint(int screenWidth);
    void registerTheme(jsi::Runtime& rt, std::string name, jsi::Object&& theme);
    void registerBreakpoints(std::vector<std::pair<std::string, double>>& sortedBreakpoints);
    void setPrefersAdaptiveThemes(bool prefersAdaptiveThemes);
    void setInitialThemeName(std::string themeName);
    void setInitialThemeNameCallback(jsi::Function&& getInitialThemeNameFn);
    void updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback);
    
private:
    jsi::Runtime* _rt;
    std::unordered_map<std::string, jsi::WeakObject> _jsThemes{};
};

}
