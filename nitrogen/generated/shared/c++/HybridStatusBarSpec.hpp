///
/// HybridStatusBarSpec.hpp
/// Mon Sep 02 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#pragma once

#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif



#include <optional>
#include <string>

namespace margelo::nitro::unistyles {

  using namespace margelo::nitro;

  /**
   * An abstract base class for `StatusBar`
   * Inherit this class to create instances of `HybridStatusBarSpec` in C++.
   * @example
   * ```cpp
   * class HybridStatusBar: public HybridStatusBarSpec {
   *   // ...
   * };
   * ```
   */
  class HybridStatusBarSpec: public virtual HybridObject {
    public:
      // Constructor
      explicit HybridStatusBarSpec(): HybridObject(TAG) { }

      // Destructor
      virtual ~HybridStatusBarSpec() { }

    public:
      // Properties
      virtual double getWidth() = 0;
      virtual double getHeight() = 0;

    public:
      // Methods
      virtual void setBackgroundColor(const std::optional<std::string>& hex, std::optional<double> alpha) = 0;

    protected:
      // Hybrid Setup
      void loadHybridMethods() override;

    protected:
      // Tag for logging
      static constexpr auto TAG = "StatusBar";
  };

} // namespace margelo::nitro::unistyles
