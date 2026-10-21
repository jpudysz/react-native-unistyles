#include "BackgroundImageConverter.h"

#include <algorithm>
#include <cxxreact/ReactNativeVersion.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

// React Native 0.83 added a C++ CSS parser for background images. Without
// enableNativeCSSParsing, the native props parser only accepts the processed
// form (array of gradient objects), so strings are converted here on both
// platforms.
#if __has_include(<react/renderer/css/CSSBackgroundImage.h>)
#include <folly/Conv.h>
#include <react/renderer/css/CSSBackgroundImage.h>
#include <react/renderer/css/CSSValueParser.h>
#define UNISTYLES_HAS_RN_BACKGROUND_IMAGE_PARSER 1
#endif

namespace margelo::nitro::unistyles::converters {

#ifdef UNISTYLES_HAS_RN_BACKGROUND_IMAGE_PARSER
namespace {

using namespace facebook::react;

using CSSLengthPercentage = std::variant<CSSLength, CSSPercentage>;
using CSSGradientItems = std::vector<std::variant<CSSColorStop, CSSColorHint>>;

// same output as React Native's processBackgroundImage.js
folly::dynamic toPosition(const CSSLengthPercentage &value) {
  if (std::holds_alternative<CSSLength>(value)) {
    return std::get<CSSLength>(value).value;
  }

  return folly::to<std::string>(std::get<CSSPercentage>(value).value) + "%";
}

// ARGB, same as processColor
int32_t toColor(const CSSColor &color) {
  return static_cast<int32_t>((static_cast<uint32_t>(color.a) << 24) |
                              (static_cast<uint32_t>(color.r) << 16) |
                              (static_cast<uint32_t>(color.g) << 8) |
                              static_cast<uint32_t>(color.b));
}

folly::dynamic toColorStops(const CSSGradientItems &items) {
  folly::dynamic colorStops = folly::dynamic::array();

  for (const auto &item : items) {
    if (std::holds_alternative<CSSColorHint>(item)) {
      colorStops.push_back(folly::dynamic::object("color", nullptr)(
          "position", toPosition(std::get<CSSColorHint>(item).position)));

      continue;
    }

    const auto &colorStop = std::get<CSSColorStop>(item);
    auto color = toColor(colorStop.color);

    colorStops.push_back(folly::dynamic::object("color", color)(
        "position", colorStop.startPosition.has_value()
                        ? toPosition(*colorStop.startPosition)
                        : nullptr));

    if (colorStop.endPosition.has_value()) {
      colorStops.push_back(folly::dynamic::object("color", color)(
          "position", toPosition(*colorStop.endPosition)));
    }
  }

  return colorStops;
}

std::string toKeyword(CSSLinearGradientDirectionKeyword keyword) {
  switch (keyword) {
  case CSSLinearGradientDirectionKeyword::ToTopLeft:
    return "to top left";
  case CSSLinearGradientDirectionKeyword::ToTopRight:
    return "to top right";
  case CSSLinearGradientDirectionKeyword::ToBottomLeft:
    return "to bottom left";
  case CSSLinearGradientDirectionKeyword::ToBottomRight:
    return "to bottom right";
  }

  return "to bottom right";
}

folly::dynamic toLinearGradient(const CSSLinearGradientFunction &gradient) {
  folly::dynamic direction =
      folly::dynamic::object("type", "angle")("value", 180.0);

  if (gradient.direction.has_value()) {
    const auto &value = gradient.direction->value;

    direction =
        std::holds_alternative<CSSAngle>(value)
            ? folly::dynamic::object("type", "angle")(
                  "value", std::get<CSSAngle>(value).degrees)
            : folly::dynamic::object("type", "keyword")(
                  "value",
                  toKeyword(std::get<CSSLinearGradientDirectionKeyword>(value)));
  }

  return folly::dynamic::object("type", "linear-gradient")(
      "direction", std::move(direction))("colorStops",
                                         toColorStops(gradient.items));
}

std::string toSizeKeyword(CSSRadialGradientSizeKeyword keyword) {
  switch (keyword) {
  case CSSRadialGradientSizeKeyword::ClosestSide:
    return "closest-side";
  case CSSRadialGradientSizeKeyword::ClosestCorner:
    return "closest-corner";
  case CSSRadialGradientSizeKeyword::FarthestSide:
    return "farthest-side";
  case CSSRadialGradientSizeKeyword::FarthestCorner:
    return "farthest-corner";
  }

  return "farthest-corner";
}

folly::dynamic toRadialGradient(const CSSRadialGradientFunction &gradient) {
  folly::dynamic size = "farthest-corner";
  folly::dynamic position = folly::dynamic::object("top", "50%")("left", "50%");

  if (gradient.size.has_value()) {
    const auto &value = *gradient.size;

    if (std::holds_alternative<CSSRadialGradientSizeKeyword>(value)) {
      size = toSizeKeyword(std::get<CSSRadialGradientSizeKeyword>(value));
    } else {
      const auto &explicitSize = std::get<CSSRadialGradientExplicitSize>(value);

      size = folly::dynamic::object("x", toPosition(explicitSize.sizeX))(
          "y", toPosition(explicitSize.sizeY));
    }
  }

  if (gradient.position.has_value()) {
    const auto &value = *gradient.position;

    position = folly::dynamic::object();

    if (value.top.has_value()) {
      position["top"] = toPosition(*value.top);
    }

    if (value.bottom.has_value()) {
      position["bottom"] = toPosition(*value.bottom);
    }

    if (value.left.has_value()) {
      position["left"] = toPosition(*value.left);
    }

    if (value.right.has_value()) {
      position["right"] = toPosition(*value.right);
    }
  }

  auto isCircle = gradient.shape.has_value() &&
                  *gradient.shape == CSSRadialGradientShape::Circle;

  return folly::dynamic::object("type", "radial-gradient")(
      "shape", isCircle ? "circle" : "ellipse")("size", std::move(size))(
      "position", std::move(position))("colorStops",
                                       toColorStops(gradient.items));
}

} // namespace
#endif

bool isBackgroundImagePropName(const std::string &propertyName) {
  return propertyName == "backgroundImage" ||
         propertyName == "experimental_backgroundImage";
}

bool hasSafeBackgroundImageColorStops(const folly::dynamic &backgroundImages) {
  if (!backgroundImages.isArray()) {
    return false;
  }

  return std::all_of(
      backgroundImages.begin(), backgroundImages.end(), [](const auto &image) {
        if (!image.isObject() || image.count("colorStops") == 0) {
          return false;
        }

        const auto &colorStops = image["colorStops"];

        return colorStops.isArray() && colorStops.size() >= 2;
      });
}

std::optional<folly::dynamic>
parseBackgroundImageString(const std::string &backgroundImageString) {
#ifdef UNISTYLES_HAS_RN_BACKGROUND_IMAGE_PARSER
  using namespace facebook::react;

  auto maybeBackgroundImages =
      parseCSSProperty<CSSBackgroundImageList>(backgroundImageString);

  if (!std::holds_alternative<CSSBackgroundImageList>(maybeBackgroundImages)) {
    return folly::dynamic::array();
  }

  folly::dynamic backgroundImages = folly::dynamic::array();

  for (const auto &backgroundImage :
       std::get<CSSBackgroundImageList>(maybeBackgroundImages)) {
    if (std::holds_alternative<CSSLinearGradientFunction>(backgroundImage)) {
      backgroundImages.push_back(
          toLinearGradient(std::get<CSSLinearGradientFunction>(backgroundImage)));
    } else if (std::holds_alternative<CSSRadialGradientFunction>(
                   backgroundImage)) {
      backgroundImages.push_back(
          toRadialGradient(std::get<CSSRadialGradientFunction>(backgroundImage)));
    }
  }

  return hasSafeBackgroundImageColorStops(backgroundImages)
             ? std::move(backgroundImages)
             : folly::dynamic::array();
#else
  return std::nullopt;
#endif
}

// React Native parses background image strings natively since 0.83, but only
// with enableNativeCSSParsing. Otherwise its view props expect the processed
// array and read a string as no background image.
bool canReactNativeParseBackgroundImageString() {
#if REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 83
  return facebook::react::ReactNativeFeatureFlags::enableNativeCSSParsing();
#else
  return false;
#endif
}

} // namespace margelo::nitro::unistyles::converters
