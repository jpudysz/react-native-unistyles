#pragma once

#include "HybridNavigationBarSpec.hpp"
// todo remove me
#include <NitroModules/HybridContext.hpp>
#include "Unistyles-Swift-Cxx-Umbrella.hpp"

using namespace margelo::nitro::unistyles;

struct HybridNavigationBar: public HybridNavigationBarSpec {
    HybridNavigationBar(Unistyles::HybridNativePlatformSpecCxx _nativePlatform): nativePlatform{_nativePlatform} {}
    
    void setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;
    void setHidden(bool isHidden) override;
    double getWidth() override;
    double getHeight() override;
    
private:
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
};

