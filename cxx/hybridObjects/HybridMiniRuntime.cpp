#include "HybridMiniRuntime.h"

ColorScheme HybridMiniRuntime::getColorScheme() {
    return this->unistylesRuntime->getColorScheme();
}

bool HybridMiniRuntime::getHasAdaptiveThemes() {
    return this->unistylesRuntime->getHasAdaptiveThemes();
}

Dimensions HybridMiniRuntime::getScreen() {
    return this->unistylesRuntime->getScreen();
}

std::optional<std::string> HybridMiniRuntime::getThemeName() {
    return this->unistylesRuntime->getThemeName();
}

std::string HybridMiniRuntime::getContentSizeCategory() {
    return this->unistylesRuntime->getContentSizeCategory();
}

std::optional<std::string> HybridMiniRuntime::getBreakpoint() {
    return this->unistylesRuntime->getBreakpoint();
}

Insets HybridMiniRuntime::getInsets() {
    return this->unistylesRuntime->getInsets();
}

Orientation HybridMiniRuntime::getOrientation() {
    return this->unistylesRuntime->getOrientation();
}

double HybridMiniRuntime::getPixelRatio() {
    return this->unistylesRuntime->getPixelRatio();
}

double HybridMiniRuntime::getFontScale() {
    return this->unistylesRuntime->getFontScale();
}

bool HybridMiniRuntime::getRtl() {
    return this->unistylesRuntime->getRtl();
}

Dimensions HybridMiniRuntime::getStatusBar() {
    return this->unistylesRuntime->getStatusBarDimensions();
}

Dimensions HybridMiniRuntime::getNavigationBar() {
    return this->unistylesRuntime->getNavigationBarDimensions();
}
