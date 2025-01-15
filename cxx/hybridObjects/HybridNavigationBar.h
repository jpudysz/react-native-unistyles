#pragma once

#include "HybridUnistylesNavigationBarSpec.hpp"
#include "NativePlatform.h"
#include <optional>

using namespace margelo::nitro::unistyles;

struct HybridNavigationBar: public HybridUnistylesNavigationBarSpec {
    HybridNavigationBar(std::shared_ptr<HybridNativePlatformSpec> nativePlatform): HybridObject(TAG), _nativePlatform{nativePlatform} {}

    void setHidden(bool isHidden) override;
    double getWidth() override;
    double getHeight() override;

private:
    std::shared_ptr<HybridNativePlatformSpec> _nativePlatform;
};
