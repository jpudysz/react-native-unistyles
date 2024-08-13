#pragma once

#include "HybridStatusBarSpec.hpp"

using namespace margelo::nitro::unistyles;

struct HybridStatusBar: public HybridStatusBarSpec {
    void setStyle(StatusBarStyle style) override;
    void setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;
    void setHidden(bool isHidden) override;
    double getWidth() override;
    double getHeight() override;
};

