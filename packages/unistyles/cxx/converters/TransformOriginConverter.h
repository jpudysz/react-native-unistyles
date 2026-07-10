#pragma once

#include <folly/dynamic.h>
#include <optional>
#include <string>

namespace margelo::nitro::unistyles::converters {

bool isTransformOriginPropName(const std::string &propertyName);
std::optional<folly::dynamic>
parseTransformOriginString(const std::string &transformOriginString);

} // namespace margelo::nitro::unistyles::converters
