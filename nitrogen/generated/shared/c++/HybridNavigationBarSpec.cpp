///
/// HybridNavigationBarSpec.cpp
/// Sat Aug 17 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/react-native-nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#include "HybridNavigationBarSpec.hpp"

namespace margelo::nitro::unistyles {

  void HybridNavigationBarSpec::loadHybridMethods() {
    // load base methods/properties
    HybridObject::loadHybridMethods();
    // load custom methods/properties
    registerHybrids(this, [](Prototype& prototype) {
      prototype.registerHybridGetter("width", &HybridNavigationBarSpec::getWidth);
      prototype.registerHybridGetter("height", &HybridNavigationBarSpec::getHeight);
      prototype.registerHybridMethod("setBackgroundColor", &HybridNavigationBarSpec::setBackgroundColor);
      prototype.registerHybridMethod("setHidden", &HybridNavigationBarSpec::setHidden);
    });
  }

} // namespace margelo::nitro::unistyles
