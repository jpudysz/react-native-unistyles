#pragma once

#include <jsi/jsi.h>
#include <optional>
#include <string>

namespace margelo::nitro::unistyles::converters {

bool isFontVariationSettingsPropName(const std::string &propertyName);
// { wght: 700, slnt: -10 }, as opposed to a breakpoints object
bool isFontVariationSettingsObject(facebook::jsi::Runtime &rt,
                                   facebook::jsi::Object &value);
std::optional<std::string>
fontVariationSettingsToString(facebook::jsi::Runtime &rt,
                              facebook::jsi::Object &value);

} // namespace margelo::nitro::unistyles::converters
