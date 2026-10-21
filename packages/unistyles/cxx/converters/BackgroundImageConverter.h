#pragma once

#include <folly/dynamic.h>
#include <optional>
#include <string>

namespace margelo::nitro::unistyles::converters {

bool isBackgroundImagePropName(const std::string &propertyName);
bool hasSafeBackgroundImageColorStops(const folly::dynamic &backgroundImages);
std::optional<folly::dynamic>
parseBackgroundImageString(const std::string &backgroundImageString);
bool canReactNativeParseBackgroundImageString();

} // namespace margelo::nitro::unistyles::converters
