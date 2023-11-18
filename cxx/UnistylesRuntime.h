#pragma once

#include <jsi/jsi.h>
#include <vector>

using namespace facebook;

const std::string UnistylesOrientationPortrait = "portrait";
const std::string UnistylesOrientationLandscape = "landscape";

const std::string UnistylesDarkScheme = "dark";
const std::string UnistylesLightScheme = "light";
const std::string UnistylesUnspecifiedScheme = "unspecified";

const std::string UnistylesErrorBreakpointsCannotBeEmpty = "UNISTYLES_ERROR_BREAKPOINTS_CANNOT_BE_EMPTY'";
const std::string UnistylesErrorBreakpointsMustStartFromZero = "UNISTYLES_ERROR_BREAKPOINTS_MUST_START_FROM_ZER0";
const std::string UnistylesErrorThemesCannotBeEmpty = "UNISTYLES_ERROR_THEMES_CANNOT_BE_EMPTY";

class JSI_EXPORT UnistylesRuntime : public jsi::HostObject {
private:
    std::function<void(std::string)> onThemeChangeCallback;
    std::function<void(std::string breakpoint, std::string orientation, int screenWidth, int screenHeight)> onLayoutChangeCallback;
    std::function<void()> onPluginChangeCallback;

    int screenWidth;
    int screenHeight;
    std::string colorScheme;

public:
    UnistylesRuntime(
        int screenWidth,
        int screenHeight,
        std::string colorScheme
    ): screenWidth(screenWidth), screenHeight(screenHeight), colorScheme(colorScheme) {}

    bool hasAdaptiveThemes;
    bool supportsAutomaticColorScheme;

    std::string themeName;
    std::string breakpoint;
    std::vector<std::string> pluginNames;
    std::vector<std::string> themes;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs;
    
    void onThemeChange(std::function<void(std::string)> callback) {
        this->onThemeChangeCallback = callback;
    }
    
    void onLayoutChange(std::function<void(std::string breakpoint, std::string orientation, int screenWidth, int screenHeight)> callback) {
        this->onLayoutChangeCallback = callback;
    }
    
    void onPluginChange(std::function<void()> callback) {
        this->onPluginChangeCallback = callback;
    }

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    void set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

    void handleScreenSizeChange(int width, int height);
    void handleAppearanceChange(std::string colorScheme);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
};
