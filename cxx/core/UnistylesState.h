#pragma once

#include <string>
#include <optional>
#include <jsi/jsi.h>
#include <vector>
#include "Helpers.h"

namespace margelo::nitro::unistyles::core {

struct UnistylesRegistry;

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

    jsi::Object getJSTheme();
    void computeCurrentBreakpoint(int screenWidth);

private:
    jsi::Runtime* _rt;
    std::unordered_map<std::string, jsi::WeakObject> _jsThemes{};
    std::optional<bool> prefersAdaptiveThemes = std::nullopt;
    std::optional<std::string> initialThemeName = std::nullopt;
    std::optional<std::string> currentBreakpointName = std::nullopt;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs{};
    std::vector<std::string> registeredThemeNames{};
    std::optional<std::string> currentThemeName = std::nullopt;

    friend class UnistylesRegistry;
};

}
