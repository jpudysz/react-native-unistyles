#include "HybridStatusBar.h"

double HybridStatusBar::getWidth() {
    return this->_nativePlatform.getStatusBarDimensions().width;
}

double HybridStatusBar::getHeight() {
    return this->_nativePlatform.getStatusBarDimensions().height;
}

void HybridStatusBar::setHidden(bool isHidden) {
    return this->_nativePlatform.setStatusBarHidden(isHidden);
}
