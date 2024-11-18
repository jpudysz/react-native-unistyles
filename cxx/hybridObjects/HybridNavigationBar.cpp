#include "HybridNavigationBar.h"

void HybridNavigationBar::setHidden(bool isHidden) {
    this->_nativePlatform.setNavigationBarHidden(isHidden);
};

double HybridNavigationBar::getWidth() {
    return this->_nativePlatform.getNavigationBarDimensions().width;
}

double HybridNavigationBar::getHeight() {
    return this->_nativePlatform.getNavigationBarDimensions().height;
}
