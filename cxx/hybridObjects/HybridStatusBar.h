#pragma once

#include "HybridUnistylesStatusBarSpec.hpp"
#include "NativePlatform.h"
#include <optional>

using namespace margelo::nitro::unistyles;

struct HybridStatusBar: public HybridUnistylesStatusBarSpec {
    HybridStatusBar(std::shared_ptr<HybridNativePlatformSpec> nativePlatform): HybridObject(TAG), _nativePlatform{nativePlatform} {}

    double getWidth() override;
    double getHeight() override;
    void setHidden(bool isHidden) override;

private:
    std::shared_ptr<HybridNativePlatformSpec> _nativePlatform;
};
