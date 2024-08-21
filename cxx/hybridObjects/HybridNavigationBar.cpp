#include "HybridNavigationBar.h"

void HybridNavigationBar::setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) {
    this->nativePlatform.setNavigationBarBackgroundColor(hex, alpha);
};

void HybridNavigationBar::setHidden(bool isHidden) {
    this->nativePlatform.setNavigationBarHidden(isHidden);
};

double HybridNavigationBar::getWidth() {
    return this->nativePlatform.getNavigationBarDimensions().width;
}

double HybridNavigationBar::getHeight() {
    return this->nativePlatform.getNavigationBarDimensions().height;
}
