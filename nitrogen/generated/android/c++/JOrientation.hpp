///
/// JOrientation.hpp
/// Fri Sep 13 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#pragma once

#include <fbjni/fbjni.h>
#include "Orientation.hpp"

namespace margelo::nitro::unistyles {

  using namespace facebook;

  /**
   * The C++ JNI bridge between the C++ enum "Orientation" and the the Kotlin enum "Orientation".
   */
  struct JOrientation final: public jni::JavaClass<JOrientation> {
  public:
    static auto constexpr kJavaDescriptor = "Lcom/margelo/nitro/unistyles/Orientation;";

  public:
    /**
     * Convert this Java/Kotlin-based enum to the C++ enum Orientation.
     */
    [[maybe_unused]]
    Orientation toCpp() const {
      static const auto clazz = javaClassStatic();
      static const auto fieldOrdinal = clazz->getField<int>("ordinal");
      int ordinal = this->getFieldValue(fieldOrdinal);
      return static_cast<Orientation>(ordinal);
    }

  public:
    /**
     * Create a Java/Kotlin-based enum with the given C++ enum's value.
     */
    [[maybe_unused]]
    static jni::alias_ref<JOrientation> fromCpp(Orientation value) {
      static const auto clazz = javaClassStatic();
      static const auto fieldPORTRAIT = clazz->getStaticField<JOrientation>("PORTRAIT");
      static const auto fieldLANDSCAPE = clazz->getStaticField<JOrientation>("LANDSCAPE");
      
      switch (value) {
        case Orientation::PORTRAIT:
          return clazz->getStaticFieldValue(fieldPORTRAIT);
        case Orientation::LANDSCAPE:
          return clazz->getStaticFieldValue(fieldLANDSCAPE);
        default:
          std::string stringValue = std::to_string(static_cast<int>(value));
          throw std::runtime_error("Invalid enum value (" + stringValue + "!");
      }
    }
  };

} // namespace margelo::nitro::unistyles
