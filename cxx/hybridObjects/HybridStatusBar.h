#pragma once

#include "HybridUnistylesStatusBarSpec.hpp"
#include "Unistyles-Swift-Cxx-Umbrella.hpp"
#include <optional>

using namespace margelo::nitro::unistyles;

struct HybridStatusBar: public HybridUnistylesStatusBarSpec {
    HybridStatusBar(Unistyles::HybridNativePlatformSpecCxx nativePlatform): HybridObject(TAG), _nativePlatform{nativePlatform} {}
 
    void setBackgroundColor(double color) override;
    double getWidth() override;
    double getHeight() override;
    void setHidden(bool isHidden) override;
    
private:
    Unistyles::HybridNativePlatformSpecCxx _nativePlatform;
};
