///
/// Insets.hpp
/// Fri Sep 13 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#pragma once

#if __has_include(<NitroModules/JSIConverter.hpp>)
#include <NitroModules/JSIConverter.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif
#if __has_include(<NitroModules/NitroDefines.hpp>)
#include <NitroModules/NitroDefines.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif





namespace margelo::nitro::unistyles {

  /**
   * A struct which can be represented as a JavaScript object (Insets).
   */
  struct Insets {
  public:
    double top     SWIFT_PRIVATE;
    double bottom     SWIFT_PRIVATE;
    double left     SWIFT_PRIVATE;
    double right     SWIFT_PRIVATE;
    double ime     SWIFT_PRIVATE;

  public:
    explicit Insets(double top, double bottom, double left, double right, double ime): top(top), bottom(bottom), left(left), right(right), ime(ime) {}
  };

} // namespace margelo::nitro::unistyles

namespace margelo::nitro {

  using namespace margelo::nitro::unistyles;

  // C++ Insets <> JS Insets (object)
  template <>
  struct JSIConverter<Insets> {
    static inline Insets fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
      jsi::Object obj = arg.asObject(runtime);
      return Insets(
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "top")),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "bottom")),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "left")),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "right")),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "ime"))
      );
    }
    static inline jsi::Value toJSI(jsi::Runtime& runtime, const Insets& arg) {
      jsi::Object obj(runtime);
      obj.setProperty(runtime, "top", JSIConverter<double>::toJSI(runtime, arg.top));
      obj.setProperty(runtime, "bottom", JSIConverter<double>::toJSI(runtime, arg.bottom));
      obj.setProperty(runtime, "left", JSIConverter<double>::toJSI(runtime, arg.left));
      obj.setProperty(runtime, "right", JSIConverter<double>::toJSI(runtime, arg.right));
      obj.setProperty(runtime, "ime", JSIConverter<double>::toJSI(runtime, arg.ime));
      return obj;
    }
    static inline bool canConvert(jsi::Runtime& runtime, const jsi::Value& value) {
      if (!value.isObject()) {
        return false;
      }
      jsi::Object obj = value.getObject(runtime);
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "top"))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "bottom"))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "left"))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "right"))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "ime"))) return false;
      return true;
    }
  };

} // namespace margelo::nitro
