#pragma once

#include "HybridUnistylesRuntimeSpec.hpp"
#include "HybridNativePlatformSpec.hpp"
// todo remove me
#include <NitroModules/HybridContext.hpp>
#include "Unistyles-Swift-Cxx-Umbrella.hpp"
#include "Helpers.h"

using namespace margelo::nitro::unistyles;

struct HybridUnistylesRuntime: public HybridUnistylesRuntimeSpec {
    HybridUnistylesRuntime(Unistyles::HybridNativePlatformSpecCxx _nativePlatform): nativePlatform{_nativePlatform} {}

    ColorScheme getColorScheme() override;
    bool getHasAdaptiveThemes() override;
    bool getRtl() override;
    Dimensions getScreen() override;
    std::optional<std::string> getThemeName() override;
    std::string getContentSizeCategory() override;
    std::optional<std::string> getBreakpoint() override;
    Insets getInsets() override;
    Orientation getOrientation() override;
    double getPixelRatio() override;
    double getFontScale() override;

    void setTheme(const std::string &themeName) override;
    void setAdaptiveThemes(bool isEnabled) override;
    void setImmersiveMode(bool isEnabled) override;
    void setRootViewBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;

    // internals
    Dimensions getStatusBarDimensions();
    Dimensions getNavigationBarDimensions();

    std::optional<bool> prefersAdaptiveThemes;
    bool canHaveAdaptiveThemes = false;
    std::optional<std::string> initialThemeName = std::nullopt;
    std::optional<std::string> currentThemeName = std::nullopt;
    std::optional<std::string> currentBreakpointName = std::nullopt;
    std::vector<std::pair<std::string, double>> sortedBreakpointPairs{};
    std::vector<std::string> registeredThemeNames{};

private:
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
};
