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
    std::optional<std::string> getCurrentBreakpointName();
    std::vector<std::pair<std::string, double>> getSortedBreakpointPairs();

    jsi::Object getJSTheme();
    int parseColor(std::optional<std::string> color);
    void computeCurrentBreakpoint(int screenWidth);
    void registerProcessColorFunction(jsi::Function&& fn);

private:
    jsi::Runtime* _rt;
    std::unordered_map<std::string, jsi::WeakObject> _jsThemes{};
    std::optional<bool> _prefersAdaptiveThemes = std::nullopt;
    std::optional<std::string> _initialThemeName = std::nullopt;
    std::optional<std::string> _currentBreakpointName = std::nullopt;
    std::vector<std::pair<std::string, double>> _sortedBreakpointPairs{};
    std::vector<std::string> _registeredThemeNames{};
    std::optional<std::string> _currentThemeName = std::nullopt;
    std::shared_ptr<jsi::Function> _processColorFn;

    friend class UnistylesRegistry;
};

}
