#pragma once

#include <jsi/jsi.h>
#include <vector>
#include <map>
#include <optional>

using namespace facebook;

const std::string UnistylesOrientationPortrait = "portrait";
const std::string UnistylesOrientationLandscape = "landscape";

const std::string UnistylesDarkScheme = "dark";
const std::string UnistylesLightScheme = "light";
const std::string UnistylesUnspecifiedScheme = "unspecified";

const std::string UnistylesErrorBreakpointsCannotBeEmpty = "You are trying to register empty breakpoints object";
const std::string UnistylesErrorBreakpointsMustStartFromZero = "You are trying to register breakpoints that don't start from 0";
const std::string UnistylesErrorThemesCannotBeEmpty = "You are trying to register empty themes object";
const std::string UnistylesErrorAdaptiveThemesNotSupported = "Your platform doesn't support adaptive themes";

struct Dimensions {
    int width;
    int height;
};

struct Insets {
    int top;
    int bottom;
    int left;
    int right;
};

class JSI_EXPORT UnistylesRuntime : public jsi::HostObject {
private:
    std::function<void(std::string)> onThemeChangeCallback;
    std::function<void(std::string breakpoint, std::string orientation, Dimensions& screen, Dimensions& statusBar, Insets& insets, Dimensions& navigationBar)> onLayoutChangeCallback;
    std::function<void(std::string)> onContentSizeCategoryChangeCallback;
    std::function<void()> onPluginChangeCallback;
    std::optional<std::function<void(std::string)>> onSetStatusBarColorCallback;
    std::optional<std::function<void(std::string)>> onSetNavigationBarColorCallback;
    
    Dimensions screen;
    Dimensions statusBar;
    Dimensions navigationBar;
    Insets insets;
    std::string colorScheme;
    std::string contentSizeCategory;
    
public:
    UnistylesRuntime(
        Dimensions screen,
        std::string colorScheme,
        std::string contentSizeCategory,
        Insets insets,
        Dimensions statusBar,
        Dimensions navigationBar
     ): screen(screen),
        colorScheme(colorScheme),
        contentSizeCategory(contentSizeCategory),
        insets(insets),
        statusBar(statusBar),
        navigationBar(navigationBar) {}

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
    
    void onLayoutChange(std::function<void(std::string breakpoint, std::string orientation, Dimensions& screen, Dimensions& statusBar, Insets& insets, Dimensions& navigationBar)> callback) {
        this->onLayoutChangeCallback = callback;
    }
    
    void onPluginChange(std::function<void()> callback) {
        this->onPluginChangeCallback = callback;
    }
    
    void onContentSizeCategoryChange(std::function<void(std::string)> callback) {
        this->onContentSizeCategoryChangeCallback = callback;
    }
    
    void onSetStatusBarColor(std::function<void(std::string color)> callback) {
        this->onSetStatusBarColorCallback = callback;
    }
    
    void onSetNavigationBarColor(std::function<void(std::string color)> callback) {
        this->onSetNavigationBarColorCallback = callback;
    }

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    void set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

    void handleScreenSizeChange(Dimensions& screen, Insets& insets, Dimensions& statusBar, Dimensions& navigationBar);
    void handleAppearanceChange(std::string colorScheme);
    void handleContentSizeCategoryChange(std::string contentSizeCategory);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
};
