#include "HybridUnistylesRuntime.h"

using namespace margelo::nitro::unistyles;

ColorScheme HybridUnistylesRuntime::getColorScheme() {
    return ColorScheme::LIGHT;
};

bool HybridUnistylesRuntime::getHasAdaptiveThemes() {
    return false;
};

Dimensions HybridUnistylesRuntime::getScreen() {
    return Dimensions{600, 200};
};

std::string HybridUnistylesRuntime::getThemeName() {
    return "light";
};

std::string HybridUnistylesRuntime::getContentSizeCategory() {
    return "unspecified";
};

std::string HybridUnistylesRuntime::getBreakpoint() {
    return "md";
};

Insets HybridUnistylesRuntime::getInsets() {
    return Insets{20, 0, 0, 0, 0};
};

Orientation HybridUnistylesRuntime::getOrientation() {
    return Orientation::PORTRAIT;
};

double HybridUnistylesRuntime::getPixelRatio() {
    return 1.0;
};

double HybridUnistylesRuntime::getFontScale() {
    return this->platform->getFontScale();
//    return 1.0;
};

void HybridUnistylesRuntime::setTheme(const std::string &themeName) {};
void HybridUnistylesRuntime::setAdaptiveThemes(bool isEnabled) {};
void HybridUnistylesRuntime::setImmersiveMode(bool isEnabled) {};
void HybridUnistylesRuntime::setRootViewBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) {};
