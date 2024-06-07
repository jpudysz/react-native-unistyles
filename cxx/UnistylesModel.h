#pragma once

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
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

using EventNestedValue = std::map<std::string, std::variant<std::string, int>>;
using EventValue = std::variant<std::string, int>;
using EventPayload = std::map<std::string, std::variant<std::string, int, EventNestedValue>>;

struct UnistylesModel {

    void onThemeChange(std::string themeName);
    void onPluginChange();
    void onContentSizeCategoryChange(std::string contentSizeCategory);
    void onLayoutChange(std::string breakpoint, std::string orientation, Dimensions& screen, Dimensions& statusBar, Insets& insets, Dimensions& navigationBar);

    std::optional<std::function<void(std::string)>> onSetStatusBarColorCallback;
    std::optional<std::function<void(std::string)>> onSetNavigationBarColorCallback;

    Dimensions screen;
    Dimensions statusBar;
    Dimensions navigationBar;
    Insets insets;
    std::string colorScheme;
    std::string contentSizeCategory;

    UnistylesModel(
        Dimensions screen,
        std::string colorScheme,
        std::string contentSizeCategory,
        Insets insets,
        Dimensions statusBar,
        Dimensions navigationBar,
        jsi::Runtime& rt,
        std::shared_ptr<react::CallInvoker> callInvoker
    ): screen(screen),
        colorScheme(colorScheme),
        contentSizeCategory(contentSizeCategory),
        insets(insets),
        statusBar(statusBar),
        navigationBar(navigationBar),
        runtime(rt),
        callInvoker(callInvoker) {}

    bool hasAdaptiveThemes;
    bool supportsAutomaticColorScheme;

    std::string themeName;
    std::string breakpoint;
    std::vector<std::string> pluginNames;
    std::vector<std::string> themes;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs;

    void onSetStatusBarColor(std::function<void(std::string color)> callback) {
        this->onSetStatusBarColorCallback = callback;
    }

    void onSetNavigationBarColor(std::function<void(std::string color)> callback) {
        this->onSetNavigationBarColorCallback = callback;
    }

    void handleScreenSizeChange(Dimensions& screen, Insets& insets, Dimensions& statusBar, Dimensions& navigationBar);
    void handleAppearanceChange(std::string colorScheme);
    void handleContentSizeCategoryChange(std::string contentSizeCategory);
    void emitDeviceEvent(const std::string eventType, EventPayload payload);
    jsi::Object parseEventPayload(EventPayload payload);
    jsi::Object parseEventNestedPayload(EventNestedValue payload);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
    std::vector<std::pair<std::string, double>> toSortedBreakpointPairs(jsi::Runtime&, jsi::Object&);

private:
    jsi::Runtime& runtime;
    std::shared_ptr<react::CallInvoker> callInvoker;
};
