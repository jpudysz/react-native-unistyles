#pragma once

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#include <vector>
#include <map>
#include <optional>
#include <variant>
#include <math.h>
#include <algorithm>

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

struct Screen {
    int width;
    int height;
    float pixelRatio;
    float fontScale;
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
    void emitDeviceEvent(const std::string eventType, EventPayload payload);
    void onThemeChange(std::string themeName);
    void onPluginChange();
    void onLayoutChange();
    jsi::Object parseEventPayload(EventPayload payload);
    jsi::Object parseEventNestedPayload(EventNestedValue payload);

    std::function<Screen()> getScreenDimensions;
    std::function<std::string()> getContentSizeCategory;
    std::function<std::string()> getColorScheme;
    std::function<Dimensions()> getStatusBarDimensions;
    std::function<Dimensions()> getNavigationBarDimensions;
    std::function<Insets()> getInsets;
    std::optional<std::function<void(std::string, float alpha)>> setStatusBarColor;
    std::optional<std::function<void(std::string, float alpha)>> setNavigationBarColor;
    std::optional<std::function<void(bool)>> setNavigationBarHidden;
    std::optional<std::function<void(bool)>> setStatusBarHidden;
    std::optional<std::function<void(bool)>> setImmersiveMode;
    std::optional<std::function<void(std::string, float alpha)>> setRootViewBackgroundColor;

    void setScreenDimensionsCallback(std::function<Screen()> callback) {
        this->getScreenDimensions = callback;
    }
    void setContentSizeCategoryCallback(std::function<std::string()> callback) {
        this->getContentSizeCategory = callback;
    }
    void setColorSchemeCallback(std::function<std::string()> callback) {
        this->getColorScheme = callback;
    }
    void setStatusBarDimensionsCallback(std::function<Dimensions()> callback) {
        this->getStatusBarDimensions = callback;
    }
    void setNavigationBarDimensionsCallback(std::function<Dimensions()> callback) {
        this->getNavigationBarDimensions = callback;
    }
    void setInsetsCallback(std::function<Insets()> callback) {
        this->getInsets = callback;
    }
    void setStatusBarColorCallback(std::function<void(std::string color, float alpha)> callback) {
        this->setStatusBarColor = callback;
    }
    void setNavigationBarColorCallback(std::function<void(std::string color, float alpha)> callback) {
        this->setNavigationBarColor = callback;
    }
    void setNavigationBarHiddenCallback(std::function<void(bool hidden)> callback) {
        this->setNavigationBarHidden = callback;
    }
    void setStatusBarHiddenCallback(std::function<void(bool hidden)> callback) {
        this->setStatusBarHidden = callback;
    }
    void setImmersiveModeCallback(std::function<void(bool enabled)> callback) {
        this->setImmersiveMode = callback;
    }
    void setRootViewBackgroundColorCallback(std::function<void(std::string color, float alpha)> callback) {
        this->setRootViewBackgroundColor = callback;
    }

    Dimensions screen = {0, 0};
    Dimensions statusBar = {0, 0};
    Dimensions navigationBar = {0, 0};
    Insets insets = {0, 0, 0, 0};
    float pixelRatio = 1.0;
    float fontScale = 1.0;
    bool rtl = false;
    std::string colorScheme = UnistylesUnspecifiedScheme;
    std::string contentSizeCategory = UnistylesUnspecifiedScheme;

    UnistylesModel(jsi::Runtime& rt, std::shared_ptr<react::CallInvoker> callInvoker): runtime(rt), callInvoker(callInvoker) {}

    bool hasAdaptiveThemes;
    bool supportsAutomaticColorScheme;

    std::string themeName;
    std::string breakpoint;
    std::vector<std::string> pluginNames;
    std::vector<std::string> themes;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs;

    void handleScreenSizeChange(Screen& screen, std::optional<Insets> insets, std::optional<Dimensions> statusBar, std::optional<Dimensions> navigationBar);
    void handleAppearanceChange(std::string colorScheme);
    void handleContentSizeCategoryChange(std::string contentSizeCategory);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
    std::vector<std::pair<std::string, double>> toSortedBreakpointPairs(jsi::Runtime&, jsi::Object&);

private:
    jsi::Runtime& runtime;
    std::shared_ptr<react::CallInvoker> callInvoker;
};
