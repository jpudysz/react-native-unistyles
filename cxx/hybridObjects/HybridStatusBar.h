#pragma once

#include "HybridUnistylesStatusBarSpec.hpp"
#include "NativePlatform.h"
#include <optional>

using namespace margelo::nitro::unistyles;

struct HybridStatusBar: public HybridUnistylesStatusBarSpec {
    HybridStatusBar(Unistyles::HybridNativePlatformSpecCxx nativePlatform): HybridObject(TAG), _nativePlatform{nativePlatform} {}

    double getWidth() override;
    double getHeight() override;
    void setHidden(bool isHidden) override;

private:
    Unistyles::HybridNativePlatformSpecCxx _nativePlatform;
};
