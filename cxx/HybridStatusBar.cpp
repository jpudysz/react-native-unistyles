#include "HybridStatusBar.h"

void HybridStatusBar::setStyle(StatusBarStyle style) {};

void HybridStatusBar::setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) {};

void HybridStatusBar::setHidden(bool isHidden) {};

double HybridStatusBar::getWidth() {
    return 360;
}

double HybridStatusBar::getHeight() {
    return 20;
}

