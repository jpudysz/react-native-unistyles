///
/// UnistylesMiniRuntime.hpp
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

// Forward declaration of `ColorScheme` to properly resolve imports.
namespace margelo::nitro::unistyles { enum class ColorScheme; }
// Forward declaration of `Dimensions` to properly resolve imports.
namespace margelo::nitro::unistyles { struct Dimensions; }
// Forward declaration of `Insets` to properly resolve imports.
namespace margelo::nitro::unistyles { struct Insets; }
// Forward declaration of `Orientation` to properly resolve imports.
namespace margelo::nitro::unistyles { enum class Orientation; }

#include "ColorScheme.hpp"
#include "Dimensions.hpp"
#include <optional>
#include <string>
#include "Insets.hpp"
#include "Orientation.hpp"

namespace margelo::nitro::unistyles {

  /**
   * A struct which can be represented as a JavaScript object (UnistylesMiniRuntime).
   */
  struct UnistylesMiniRuntime {
  public:
    ColorScheme colorScheme     SWIFT_PRIVATE;
    bool hasAdaptiveThemes     SWIFT_PRIVATE;
    Dimensions screen     SWIFT_PRIVATE;
    std::optional<std::string> themeName     SWIFT_PRIVATE;
    std::string contentSizeCategory     SWIFT_PRIVATE;
    std::optional<std::string> breakpoint     SWIFT_PRIVATE;
    Insets insets     SWIFT_PRIVATE;
    Orientation orientation     SWIFT_PRIVATE;
    double pixelRatio     SWIFT_PRIVATE;
    double fontScale     SWIFT_PRIVATE;
    bool rtl     SWIFT_PRIVATE;
    Dimensions statusBar     SWIFT_PRIVATE;
    Dimensions navigationBar     SWIFT_PRIVATE;

  public:
    explicit UnistylesMiniRuntime(ColorScheme colorScheme, bool hasAdaptiveThemes, Dimensions screen, std::optional<std::string> themeName, std::string contentSizeCategory, std::optional<std::string> breakpoint, Insets insets, Orientation orientation, double pixelRatio, double fontScale, bool rtl, Dimensions statusBar, Dimensions navigationBar): colorScheme(colorScheme), hasAdaptiveThemes(hasAdaptiveThemes), screen(screen), themeName(themeName), contentSizeCategory(contentSizeCategory), breakpoint(breakpoint), insets(insets), orientation(orientation), pixelRatio(pixelRatio), fontScale(fontScale), rtl(rtl), statusBar(statusBar), navigationBar(navigationBar) {}
  };

} // namespace margelo::nitro::unistyles

namespace margelo::nitro {

  using namespace margelo::nitro::unistyles;

  // C++ UnistylesMiniRuntime <> JS UnistylesMiniRuntime (object)
  template <>
  struct JSIConverter<UnistylesMiniRuntime> {
    static inline UnistylesMiniRuntime fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
      jsi::Object obj = arg.asObject(runtime);
      return UnistylesMiniRuntime(
        JSIConverter<ColorScheme>::fromJSI(runtime, obj.getProperty(runtime, "colorScheme")),
        JSIConverter<bool>::fromJSI(runtime, obj.getProperty(runtime, "hasAdaptiveThemes")),
        JSIConverter<Dimensions>::fromJSI(runtime, obj.getProperty(runtime, "screen")),
        JSIConverter<std::optional<std::string>>::fromJSI(runtime, obj.getProperty(runtime, "themeName")),
        JSIConverter<std::string>::fromJSI(runtime, obj.getProperty(runtime, "contentSizeCategory")),
        JSIConverter<std::optional<std::string>>::fromJSI(runtime, obj.getProperty(runtime, "breakpoint")),
        JSIConverter<Insets>::fromJSI(runtime, obj.getProperty(runtime, "insets")),
        JSIConverter<Orientation>::fromJSI(runtime, obj.getProperty(runtime, "orientation")),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "pixelRatio")),
        JSIConverter<double>::fromJSI(runtime, obj.getProperty(runtime, "fontScale")),
        JSIConverter<bool>::fromJSI(runtime, obj.getProperty(runtime, "rtl")),
        JSIConverter<Dimensions>::fromJSI(runtime, obj.getProperty(runtime, "statusBar")),
        JSIConverter<Dimensions>::fromJSI(runtime, obj.getProperty(runtime, "navigationBar"))
      );
    }
    static inline jsi::Value toJSI(jsi::Runtime& runtime, const UnistylesMiniRuntime& arg) {
      jsi::Object obj(runtime);
      obj.setProperty(runtime, "colorScheme", JSIConverter<ColorScheme>::toJSI(runtime, arg.colorScheme));
      obj.setProperty(runtime, "hasAdaptiveThemes", JSIConverter<bool>::toJSI(runtime, arg.hasAdaptiveThemes));
      obj.setProperty(runtime, "screen", JSIConverter<Dimensions>::toJSI(runtime, arg.screen));
      obj.setProperty(runtime, "themeName", JSIConverter<std::optional<std::string>>::toJSI(runtime, arg.themeName));
      obj.setProperty(runtime, "contentSizeCategory", JSIConverter<std::string>::toJSI(runtime, arg.contentSizeCategory));
      obj.setProperty(runtime, "breakpoint", JSIConverter<std::optional<std::string>>::toJSI(runtime, arg.breakpoint));
      obj.setProperty(runtime, "insets", JSIConverter<Insets>::toJSI(runtime, arg.insets));
      obj.setProperty(runtime, "orientation", JSIConverter<Orientation>::toJSI(runtime, arg.orientation));
      obj.setProperty(runtime, "pixelRatio", JSIConverter<double>::toJSI(runtime, arg.pixelRatio));
      obj.setProperty(runtime, "fontScale", JSIConverter<double>::toJSI(runtime, arg.fontScale));
      obj.setProperty(runtime, "rtl", JSIConverter<bool>::toJSI(runtime, arg.rtl));
      obj.setProperty(runtime, "statusBar", JSIConverter<Dimensions>::toJSI(runtime, arg.statusBar));
      obj.setProperty(runtime, "navigationBar", JSIConverter<Dimensions>::toJSI(runtime, arg.navigationBar));
      return obj;
    }
    static inline bool canConvert(jsi::Runtime& runtime, const jsi::Value& value) {
      if (!value.isObject()) {
        return false;
      }
      jsi::Object obj = value.getObject(runtime);
      if (!JSIConverter<ColorScheme>::canConvert(runtime, obj.getProperty(runtime, "colorScheme"))) return false;
      if (!JSIConverter<bool>::canConvert(runtime, obj.getProperty(runtime, "hasAdaptiveThemes"))) return false;
      if (!JSIConverter<Dimensions>::canConvert(runtime, obj.getProperty(runtime, "screen"))) return false;
      if (!JSIConverter<std::optional<std::string>>::canConvert(runtime, obj.getProperty(runtime, "themeName"))) return false;
      if (!JSIConverter<std::string>::canConvert(runtime, obj.getProperty(runtime, "contentSizeCategory"))) return false;
      if (!JSIConverter<std::optional<std::string>>::canConvert(runtime, obj.getProperty(runtime, "breakpoint"))) return false;
      if (!JSIConverter<Insets>::canConvert(runtime, obj.getProperty(runtime, "insets"))) return false;
      if (!JSIConverter<Orientation>::canConvert(runtime, obj.getProperty(runtime, "orientation"))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "pixelRatio"))) return false;
      if (!JSIConverter<double>::canConvert(runtime, obj.getProperty(runtime, "fontScale"))) return false;
      if (!JSIConverter<bool>::canConvert(runtime, obj.getProperty(runtime, "rtl"))) return false;
      if (!JSIConverter<Dimensions>::canConvert(runtime, obj.getProperty(runtime, "statusBar"))) return false;
      if (!JSIConverter<Dimensions>::canConvert(runtime, obj.getProperty(runtime, "navigationBar"))) return false;
      return true;
    }
  };

} // namespace margelo::nitro
