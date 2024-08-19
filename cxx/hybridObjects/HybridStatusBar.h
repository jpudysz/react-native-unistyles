#pragma once

#include "HybridStatusBarSpec.hpp"
// todo remove me
#include <NitroModules/HybridContext.hpp>
#include "Unistyles-Swift-Cxx-Umbrella.hpp"

using namespace margelo::nitro::unistyles;

struct HybridStatusBar: public HybridStatusBarSpec {
    HybridStatusBar(Unistyles::HybridNativePlatformSpecCxx _nativePlatform): nativePlatform{_nativePlatform} {}
 
    void setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;
    double getWidth() override;
    double getHeight() override;
    
private:
    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
};

