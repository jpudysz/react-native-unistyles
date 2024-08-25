#pragma once

#include <string>
#include <optional>
#include <jsi/jsi.h>
#include <vector>
#include "Helpers.h"
#include "Constants.h"

namespace margelo::nitro::unistyles::core {

struct UnistylesRegistry;

using namespace facebook;

struct UnistylesState {
    UnistylesState(jsi::Runtime& rt, jsi::Object&& miniRuntime): rt{&rt}, miniRuntime{std::move(miniRuntime)} {}
    
    UnistylesState(const UnistylesState&) = delete;
    UnistylesState(const UnistylesState&&) = delete;

    bool hasAdaptiveThemes();
    void setTheme(std::string themeName);
    bool hasTheme(std::string themeName);
    std::optional<std::string>& getCurrentThemeName();
    bool hasInitialTheme();
    int getThemesCount();
    std::string getFirstThemeName();
    std::optional<std::string> getInitialTheme();
    std::optional<std::string> getCurrentBreakpointName();
    
    jsi::Object getJSTheme();
    jsi::Object& getMiniRuntime();
    void computeCurrentBreakpoint(int screenWidth);
    
private:
    jsi::Runtime* rt;
    jsi::Object miniRuntime;
    std::unordered_map<std::string, jsi::WeakObject> jsThemes{};
    bool canHaveAdaptiveThemes = false;
    std::optional<bool> prefersAdaptiveThemes;
    std::optional<std::string> initialThemeName = std::nullopt;
    std::optional<std::string> currentBreakpointName = std::nullopt;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs{};
    std::vector<std::string> registeredThemeNames{};
    std::optional<std::string> currentThemeName = std::nullopt;
    
    friend class UnistylesRegistry;
};

}
