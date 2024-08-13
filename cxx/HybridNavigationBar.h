#pragma once

#include "HybridNavigationBarSpec.hpp"

using namespace margelo::nitro::unistyles;

struct HybridNavigationBar: public HybridNavigationBarSpec {
    void setBackgroundColor(const std::optional<std::string> &hex, std::optional<double> alpha) override;
    void setHidden(bool isHidden) override;
    double getWidth() override;
    double getHeight() override;
};

