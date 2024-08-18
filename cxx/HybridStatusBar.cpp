#include "HybridStatusBar.h"

void HybridStatusBar::setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) {
    this->nativePlatform.setStatusBarBackgroundColor(hex, alpha);
};

double HybridStatusBar::getWidth() {
    return this->nativePlatform.getStatusBarDimensions().width;
}

double HybridStatusBar::getHeight() {
    return this->nativePlatform.getStatusBarDimensions().height;
}

