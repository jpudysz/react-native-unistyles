#include "HybridUnistylesRuntime.h"

using namespace margelo::nitro::unistyles;

ColorScheme HybridUnistylesRuntime::getColorScheme() {
    int colorScheme = this->nativePlatform.getColorScheme();
    
    return static_cast<ColorScheme>(colorScheme);
}

bool HybridUnistylesRuntime::getHasAdaptiveThemes() {
    // todo
    return false;
};

Dimensions HybridUnistylesRuntime::getScreen() {
    return this->nativePlatform.getScreenDimensions();
};

std::optional<std::string> HybridUnistylesRuntime::getThemeName() {
    return this->currentThemeName;
};

std::string HybridUnistylesRuntime::getContentSizeCategory() {
    return this->nativePlatform.getContentSizeCategory();
};

std::optional<std::string> HybridUnistylesRuntime::getBreakpoint() {
    return this->currentBreakpointName;
};

bool HybridUnistylesRuntime::getRtl() {
    return this->nativePlatform.getPrefersRtlDirection();
}

Insets HybridUnistylesRuntime::getInsets() {
    return this->nativePlatform.getInsets();
};

Orientation HybridUnistylesRuntime::getOrientation() {
    auto screenDimensions = this->getScreen();
    
    if (screenDimensions.width > screenDimensions.height) {
        return Orientation::LANDSCAPE;
    }
    
    return Orientation::PORTRAIT;
};

double HybridUnistylesRuntime::getPixelRatio() {
    return this->nativePlatform.getPixelRatio();
};

double HybridUnistylesRuntime::getFontScale() {
    return this->nativePlatform.getFontScale();
};

void HybridUnistylesRuntime::setTheme(const std::string &themeName) {};
void HybridUnistylesRuntime::setAdaptiveThemes(bool isEnabled) {};
void HybridUnistylesRuntime::setImmersiveMode(bool isEnabled) {};

void HybridUnistylesRuntime::setRootViewBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) {
    this->nativePlatform.setRootViewBackgroundColor(hex, alpha);
};
