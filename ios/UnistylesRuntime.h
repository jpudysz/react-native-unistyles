#pragma once

#import "UnistylesModule.h"
#import <jsi/jsi.h>
#import <vector>

using namespace facebook;

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
        float screenWidth,
        float screenHeight,
        std::string colorScheme
    ): onThemeChange(onThemeChange),
       onBreakpointChange(onBreakpointChange),
       screenWidth(screenWidth),
       screenHeight(screenHeight),
       colorScheme(colorScheme) {}

    bool hasAdaptiveThemes;
    bool supportsAutomaticColorScheme;

    std::string theme;
    std::string breakpoint;
    std::vector<std::string> themes;
    std::vector<std::pair<std::string, double>> sortedBreakpointEntries;

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    void set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

    void handleScreenSizeChange(int width, int height);
    void handleAppearanceChange(std::string colorScheme);

    jsi::Value getThemeOrFail(jsi::Runtime&);
    std::string getBreakpointFromScreenWidth(double width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
};
