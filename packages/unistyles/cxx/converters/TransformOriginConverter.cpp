#include "TransformOriginConverter.h"

#if defined(RN_SERIALIZABLE_STATE) &&                                          \
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
