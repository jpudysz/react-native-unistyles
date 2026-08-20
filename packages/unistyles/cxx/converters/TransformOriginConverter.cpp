#include "TransformOriginConverter.h"

#if __has_include(<cxxreact/ReactNativeVersion.h>)
#include <cxxreact/ReactNativeVersion.h>
#endif

// facebook::react::parseUnprocessedTransformOriginString was introduced in
// React Native 0.85, while conversions.h is available in every supported
// version, so the include alone is not enough to detect the parser.
#if defined(RN_SERIALIZABLE_STATE) && REACT_NATIVE_VERSION_MINOR >= 85 &&      \
    __has_include(<react/renderer/components/view/conversions.h>)
#include <react/renderer/components/view/conversions.h>
#define UNISTYLES_HAS_RN_TRANSFORM_ORIGIN_PARSER 1
#endif

namespace margelo::nitro::unistyles::converters {

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
#else
  return std::nullopt;
#endif
}

} // namespace margelo::nitro::unistyles::converters
