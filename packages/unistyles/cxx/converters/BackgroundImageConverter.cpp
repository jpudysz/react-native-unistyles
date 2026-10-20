#include "BackgroundImageConverter.h"

#include <algorithm>
#include <cxxreact/ReactNativeVersion.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

#if defined(RN_SERIALIZABLE_STATE) &&                                          \
    __has_include(                                                             \
        <react/renderer/components/view/BackgroundImagePropsConversions.h>)
#include <react/renderer/components/view/BackgroundImagePropsConversions.h>
#include <react/renderer/core/propsConversions.h>
#define UNISTYLES_HAS_RN_BACKGROUND_IMAGE_PARSER 1
#endif

namespace margelo::nitro::unistyles::converters {

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
  std::vector<facebook::react::BackgroundImage> backgroundImages;

  facebook::react::parseUnprocessedBackgroundImageString(backgroundImageString,
                                                         backgroundImages);

  auto parsedBackgroundImages = facebook::react::toDynamic(backgroundImages);

  return hasSafeBackgroundImageColorStops(parsedBackgroundImages)
             ? std::move(parsedBackgroundImages)
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
