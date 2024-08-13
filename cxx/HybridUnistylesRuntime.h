#pragma once

#include "HybridUnistylesRuntimeSpec.hpp"

using namespace margelo::nitro::unistyles;

struct HybridUnistylesRuntime: public HybridUnistylesRuntimeSpec {
    ColorScheme getColorScheme() override;
    bool getHasAdaptiveThemes() override;
    Dimensions getScreen() override;
    std::string getThemeName() override;
    std::string getContentSizeCategory() override;
    std::string getBreakpoint() override;
    Insets getInsets() override;
    Orientation getOrientation() override;
    double getPixelRatio() override;
    double getFontScale() override;

    void setTheme(const std::string &themeName) override;
    void setAdaptiveThemes(bool isEnabled) override;
    void setImmersiveMode(bool isEnabled) override;
    void setRootViewBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;
};
