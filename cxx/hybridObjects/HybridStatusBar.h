#pragma once

#include "HybridUnistylesStatusBarSpec.hpp"
#include <optional>

using namespace margelo::nitro::unistyles;

struct HybridStatusBar: public HybridUnistylesStatusBarSpec {
    HybridStatusBar(Unistyles::HybridNativePlatformSpecCxx nativePlatform): HybridObject(TAG), _nativePlatform{nativePlatform} {}
 
    void setBackgroundColor(std::optional<double> color) override;
    double getWidth() override;
    double getHeight() override;
    
private:
    Unistyles::HybridNativePlatformSpecCxx _nativePlatform;
};
