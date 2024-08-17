///
/// HybridNavigationBarSpec.hpp
/// Sat Aug 17 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/react-native-nitro
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
   * An abstract base class for `NavigationBar`
   * Inherit this class to create instances of `HybridNavigationBarSpec` in C++.
   * @example
   * ```cpp
   * class HybridNavigationBar: public HybridNavigationBarSpec {
   *   // ...
   * };
   * ```
   */
  class HybridNavigationBarSpec: public HybridObject {
    public:
      // Constructor
      explicit HybridNavigationBarSpec(): HybridObject(TAG) { }

      // Destructor
      ~HybridNavigationBarSpec() { }

    public:
      // Properties
      virtual double getWidth() = 0;
      virtual double getHeight() = 0;

    public:
      // Methods
      virtual void setBackgroundColor(const std::optional<std::string>& hex, std::optional<double> alpha) = 0;
      virtual void setHidden(bool isHidden) = 0;

    protected:
      // Hybrid Setup
      void loadHybridMethods() override;

    protected:
      // Tag for logging
      static constexpr auto TAG = "NavigationBar";
  };

} // namespace margelo::nitro::unistyles
