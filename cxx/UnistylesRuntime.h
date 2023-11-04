#pragma once

#include <jsi/jsi.h>
#include <vector>

using namespace facebook;

const std::string UnistylesDarkScheme = "dark";
const std::string UnistylesLightScheme = "light";
const std::string UnistylesUnspecifiedScheme = "unspecified";

typedef void(^UnistylesThemeChangeEvent)(std::string);
typedef void(^UnistylesBreakpointChangeEvent)(std::string);

class JSI_EXPORT UnistylesRuntime : public jsi::HostObject {
private:
    UnistylesThemeChangeEvent onThemeChange;
    UnistylesBreakpointChangeEvent onBreakpointChange;

    int screenWidth;
    int screenHeight;
    std::string colorScheme;

public:
    UnistylesRuntime(
        UnistylesThemeChangeEvent onThemeChange,
        UnistylesBreakpointChangeEvent onBreakpointChange,
        int screenWidth,
        int screenHeight,
        std::string colorScheme
    ): onThemeChange(onThemeChange),
       onBreakpointChange(onBreakpointChange),
       screenWidth(screenWidth),
       screenHeight(screenHeight),
       colorScheme(colorScheme) {}

    bool hasAdaptiveThemes;
    bool supportsAutomaticColorScheme;

    std::string themeName;
    std::string breakpoint;
    std::vector<std::string> themes;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs;

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    void set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

    void handleScreenSizeChange(int width, int height);
    void handleAppearanceChange(std::string colorScheme);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
};
