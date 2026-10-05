#include "TransformOriginConverter.h"

#include <cxxreact/ReactNativeVersion.h>

// facebook::react::parseUnprocessedTransformOriginString was introduced in
// React Native 0.85, while conversions.h is available in every supported
// version, so the include alone is not enough to detect the parser.
#if defined(RN_SERIALIZABLE_STATE) &&                                          \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 85) &&    \
    __has_include(<react/renderer/components/view/conversions.h>)
#include <react/renderer/components/view/conversions.h>
#define UNISTYLES_HAS_RN_TRANSFORM_ORIGIN_PARSER 1
#elif defined(RN_SERIALIZABLE_STATE)
#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <regex>
#define UNISTYLES_HAS_TRANSFORM_ORIGIN_FALLBACK 1
#endif

namespace margelo::nitro::unistyles::converters {

#ifdef UNISTYLES_HAS_TRANSFORM_ORIGIN_FALLBACK
namespace {

// Port of React Native's processTransformOrigin.js. Android forwards raw props
// to the view manager, which expects the processed [x, y, z] array, so a string
// must not reach it. Returns null (default origin) for an invalid value.
folly::dynamic processTransformOriginString(const std::string &value) {
  static const std::regex tokenRegex(
      "(top|bottom|left|right|center|\\d+(?:%|px)|0)", std::regex::icase);
  constexpr size_t INDEX_X = 0;
  constexpr size_t INDEX_Y = 1;
  constexpr size_t INDEX_Z = 2;

  auto toLower = [](std::string token) {
    std::transform(token.begin(), token.end(), token.begin(),
                   [](unsigned char c) { return std::tolower(c); });

    return token;
  };

  folly::dynamic result = folly::dynamic::array("50%", "50%", 0);
  size_t index = INDEX_X;
  auto it = std::sregex_iterator(value.begin(), value.end(), tokenRegex);
  const auto end = std::sregex_iterator();

  for (; it != end; ++it) {
    if (index > INDEX_Z) {
      return nullptr;
    }

    auto token = toLower(it->str());
    auto nextIndex = index + 1;

    if (token == "left" || token == "right") {
      if (index != INDEX_X) {
        return nullptr;
      }

      result[INDEX_X] = token == "left" ? folly::dynamic(0) : folly::dynamic("100%");
    } else if (token == "top" || token == "bottom") {
      if (index == INDEX_Z) {
        return nullptr;
      }

      result[INDEX_Y] = token == "top" ? folly::dynamic(0) : folly::dynamic("100%");

      // [ center | left | right ] after a vertical keyword in the first place
      if (index == INDEX_X) {
        if (++it == end) {
          break;
        }

        auto horizontal = toLower(it->str());

        if (horizontal == "left") {
          result[INDEX_X] = 0;
        } else if (horizontal == "right") {
          result[INDEX_X] = "100%";
        } else if (horizontal == "center") {
          result[INDEX_X] = "50%";
        } else {
          return nullptr;
        }

        nextIndex = INDEX_Z;
      }
    } else if (token == "center") {
      if (index == INDEX_Z) {
        return nullptr;
      }

      result[index] = "50%";
    } else if (token.back() == '%') {
      if (index == INDEX_Z) {
        return nullptr;
      }

      result[index] = token;
    } else {
      // 0 or <digits>px
      result[index] = std::strtod(token.c_str(), nullptr);
    }

    index = nextIndex;
  }

  return result;
}

} // namespace
#endif

bool isTransformOriginPropName(const std::string &propertyName) {
  return propertyName == "transformOrigin";
}

std::optional<folly::dynamic>
parseTransformOriginString(const std::string &transformOriginString) {
#ifdef UNISTYLES_HAS_RN_TRANSFORM_ORIGIN_PARSER
  facebook::react::TransformOrigin transformOrigin;

  facebook::react::parseUnprocessedTransformOriginString(transformOriginString,
                                                         transformOrigin);

  if (!transformOrigin.isSet()) {
    return folly::dynamic(nullptr);
  }

  return static_cast<folly::dynamic>(transformOrigin);
#elif defined(UNISTYLES_HAS_TRANSFORM_ORIGIN_FALLBACK)
  return processTransformOriginString(transformOriginString);
#else
  return std::nullopt;
#endif
}

} // namespace margelo::nitro::unistyles::converters
