#pragma once

#include "HybridNavigationBarSpec.hpp"
#include "Unistyles-Swift-Cxx-Umbrella.hpp"

using namespace margelo::nitro::unistyles;

struct HybridNavigationBar: public HybridNavigationBarSpec {
    HybridNavigationBar(Unistyles::HybridNativePlatformSpecCxx nativePlatform): HybridObject(TAG), nativePlatform{nativePlatform} {}
    
    void setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;
    void setHidden(bool isHidden) override;
    double getWidth() override;
    double getHeight() override;
    
private:
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
};

