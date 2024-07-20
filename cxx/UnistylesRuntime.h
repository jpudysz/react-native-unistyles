#pragma once

#include "UnistylesModel.h"
#include "Macros.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

using namespace facebook;

using Getter = std::function<jsi::Value(jsi::Runtime& rt, std::string)>;
using Setter = std::function<std::optional<jsi::Value>(jsi::Runtime& rt, const jsi::Value&)>;

struct JSI_EXPORT UnistylesRuntime : public jsi::HostObject, UnistylesModel {
    UnistylesRuntime(jsi::Runtime& rt, std::shared_ptr<react::CallInvoker> callInvoker) : UnistylesModel(rt, callInvoker) {
        this->getters = {
            {"screenWidth", BIND_FN(getScreenWidth)},
            {"screenHeight", BIND_FN(getScreenHeight)},
            {"contentSizeCategory", BIND_FN(getContentSizeCategory)},
            {"hasAdaptiveThemes", BIND_FN(hasEnabledAdaptiveThemes)},
            {"themeName", BIND_FN(getThemeName)},
            {"breakpoint", BIND_FN(getCurrentBreakpoint)},
            {"colorScheme", BIND_FN(getColorScheme)},
            {"sortedBreakpointPairs", BIND_FN(getSortedBreakpointPairs)},
            {"useBreakpoints", BIND_FN(setBreakpoints)},
            {"useTheme", BIND_FN(setActiveTheme)},
            {"updateTheme", BIND_FN(updateTheme)},
            {"useAdaptiveThemes", BIND_FN(useAdaptiveThemes)},
            {"addPlugin", BIND_FN(addPlugin)},
            {"removePlugin", BIND_FN(removePlugin)},
            {"enabledPlugins", BIND_FN(getEnabledPlugins)},
            {"insets", BIND_FN(getInsets)},
            {"statusBar", BIND_FN(getStatusBar)},
            {"navigationBar", BIND_FN(getNavigationBar)},
            {"pixelRatio", BIND_FN(getPixelRatio)},
            {"fontScale", BIND_FN(getFontScale)},
            {"setRootViewBackgroundColor", BIND_FN(setRootBackgroundColor)},
            {"setImmersiveMode", BIND_FN(setImmersiveModeEnabled)},
            {"rtl", BIND_FN(getIsRtl)}
        };

        this->setters = {
            {"themes", BIND_FN(setThemes)}
        };
    };

    jsi::Value getScreenWidth(jsi::Runtime&, std::string);
    jsi::Value getScreenHeight(jsi::Runtime&, std::string);
    jsi::Value getContentSizeCategory(jsi::Runtime&, std::string);
    jsi::Value hasEnabledAdaptiveThemes(jsi::Runtime&, std::string);
    jsi::Value getThemeName(jsi::Runtime&, std::string);
    jsi::Value getCurrentBreakpoint(jsi::Runtime&, std::string);
    jsi::Value getColorScheme(jsi::Runtime&, std::string);
    jsi::Value getSortedBreakpointPairs(jsi::Runtime&, std::string);
    jsi::Value setBreakpoints(jsi::Runtime&, std::string);
    jsi::Value setActiveTheme(jsi::Runtime&, std::string);
    jsi::Value updateTheme(jsi::Runtime&, std::string);
    jsi::Value useAdaptiveThemes(jsi::Runtime&, std::string);
    jsi::Value addPlugin(jsi::Runtime&, std::string);
    jsi::Value removePlugin(jsi::Runtime&, std::string);
    jsi::Value getEnabledPlugins(jsi::Runtime&, std::string);
    jsi::Value getInsets(jsi::Runtime&, std::string);
    jsi::Value getStatusBar(jsi::Runtime&, std::string);
    jsi::Value getNavigationBar(jsi::Runtime&, std::string);
    jsi::Value getPixelRatio(jsi::Runtime&, std::string);
    jsi::Value getFontScale(jsi::Runtime&, std::string);
    jsi::Value setRootBackgroundColor(jsi::Runtime&, std::string);
    jsi::Value setImmersiveModeEnabled(jsi::Runtime&, std::string);
    jsi::Value getIsRtl(jsi::Runtime&, std::string);

    std::optional<jsi::Value> setThemes(jsi::Runtime&, const jsi::Value&);

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID&) override;
    void set(jsi::Runtime&, const jsi::PropNameID&, const jsi::Value&) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime&) override;

private:
    std::map<std::string, Getter> getters;
    std::map<std::string, Setter> setters;
};
