#pragma once

#include "HybridMiniRuntimeSpec.hpp"
#include "HybridUnistylesRuntime.h"

using namespace margelo::nitro::unistyles;

struct HybridMiniRuntime: public HybridMiniRuntimeSpec {
    HybridMiniRuntime(std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime): HybridObject(TAG), unistylesRuntime{unistylesRuntime} {}
    
    ColorScheme getColorScheme() override;
    bool getHasAdaptiveThemes() override;
    Dimensions getScreen() override;
    std::optional<std::string> getThemeName() override;
    std::string getContentSizeCategory() override;
    std::optional<std::string> getBreakpoint() override;
    Insets getInsets() override;
    Orientation getOrientation() override;
    double getPixelRatio() override;
    double getFontScale() override;
    bool getRtl() override;
    Dimensions getStatusBar() override;
    Dimensions getNavigationBar() override;
    
private:
    std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime;
};

