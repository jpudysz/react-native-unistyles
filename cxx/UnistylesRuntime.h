#pragma once

#include <jsi/jsi.h>
#include <vector>

using namespace facebook;

const std::string UnistylesOrientationPortrait = "portrait";
const std::string UnistylesOrientationLandscape = "landscape";

const std::string UnistylesDarkScheme = "dark";
const std::string UnistylesLightScheme = "light";
const std::string UnistylesUnspecifiedScheme = "unspecified";

const std::string UnistylesErrorBreakpointsCannotBeEmpty = "You are trying to register empty breakpoints object";
const std::string UnistylesErrorBreakpointsMustStartFromZero = "You are trying to register breakpoints that don't start from 0";
const std::string UnistylesErrorThemesCannotBeEmpty = "You are trying to register empty themes object";

class JSI_EXPORT UnistylesRuntime : public jsi::HostObject {
private:
    std::function<void(std::string)> onThemeChangeCallback;
    std::function<void(std::string breakpoint, std::string orientation, int screenWidth, int screenHeight)> onLayoutChangeCallback;
    std::function<void(std::string)> onContentSizeCategoryChangeCallback;
    std::function<void()> onPluginChangeCallback;

    int screenWidth;
    int screenHeight;
    std::string colorScheme;
    std::string contentSizeCategory;

public:
    UnistylesRuntime(
        int screenWidth,
        int screenHeight,
        std::string colorScheme,
        std::string contentSizeCategory
    ): screenWidth(screenWidth), screenHeight(screenHeight), colorScheme(colorScheme), contentSizeCategory(contentSizeCategory) {}

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
    
    void onContentSizeCategoryChange(std::function<void(std::string)> callback) {
        this->onContentSizeCategoryChangeCallback = callback;
    }

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    void set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

    void handleScreenSizeChange(int width, int height);
    void handleAppearanceChange(std::string colorScheme);
    void handleContentSizeCategoryChange(std::string contentSizeCategory);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
};
