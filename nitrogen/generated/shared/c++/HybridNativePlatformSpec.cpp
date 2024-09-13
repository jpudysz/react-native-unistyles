///
/// HybridNativePlatformSpec.cpp
/// Fri Sep 13 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#include "HybridNativePlatformSpec.hpp"

namespace margelo::nitro::unistyles {

  void HybridNativePlatformSpec::loadHybridMethods() {
    // load base methods/properties
    HybridObject::loadHybridMethods();
    // load custom methods/properties
    registerHybrids(this, [](Prototype& prototype) {
      prototype.registerHybridMethod("getInsets", &HybridNativePlatformSpec::getInsets);
      prototype.registerHybridMethod("getColorScheme", &HybridNativePlatformSpec::getColorScheme);
      prototype.registerHybridMethod("getFontScale", &HybridNativePlatformSpec::getFontScale);
      prototype.registerHybridMethod("getPixelRatio", &HybridNativePlatformSpec::getPixelRatio);
      prototype.registerHybridMethod("getContentSizeCategory", &HybridNativePlatformSpec::getContentSizeCategory);
      prototype.registerHybridMethod("getScreenDimensions", &HybridNativePlatformSpec::getScreenDimensions);
      prototype.registerHybridMethod("getStatusBarDimensions", &HybridNativePlatformSpec::getStatusBarDimensions);
      prototype.registerHybridMethod("getNavigationBarDimensions", &HybridNativePlatformSpec::getNavigationBarDimensions);
      prototype.registerHybridMethod("getPrefersRtlDirection", &HybridNativePlatformSpec::getPrefersRtlDirection);
      prototype.registerHybridMethod("setRootViewBackgroundColor", &HybridNativePlatformSpec::setRootViewBackgroundColor);
      prototype.registerHybridMethod("setNavigationBarBackgroundColor", &HybridNativePlatformSpec::setNavigationBarBackgroundColor);
      prototype.registerHybridMethod("setNavigationBarHidden", &HybridNativePlatformSpec::setNavigationBarHidden);
      prototype.registerHybridMethod("setStatusBarBackgroundColor", &HybridNativePlatformSpec::setStatusBarBackgroundColor);
      prototype.registerHybridMethod("setImmersiveMode", &HybridNativePlatformSpec::setImmersiveMode);
      prototype.registerHybridMethod("buildMiniRuntime", &HybridNativePlatformSpec::buildMiniRuntime);
      prototype.registerHybridMethod("registerPlatformListener", &HybridNativePlatformSpec::registerPlatformListener);
    });
  }

} // namespace margelo::nitro::unistyles
