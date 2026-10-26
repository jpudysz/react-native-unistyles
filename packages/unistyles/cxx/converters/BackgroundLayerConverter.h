#pragma once

#include <folly/dynamic.h>
#include <string>

namespace margelo::nitro::unistyles::converters {

// backgroundSize, backgroundPosition and backgroundRepeat (and their
// experimental_ aliases)
bool isBackgroundLayerPropName(const std::string &propertyName);
folly::dynamic parseBackgroundLayerString(const std::string &propertyName,
                                          const std::string &value);

} // namespace margelo::nitro::unistyles::converters
