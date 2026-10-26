#include "FontVariationSettingsConverter.h"

#include <algorithm>
#include <cmath>
#include <utility>
#include <vector>

// React Native converts the object form to a string in JS
// (processFontVariationSettings.js), and its native props only read strings,
// so shadow tree updates convert it here with the same output.
namespace margelo::nitro::unistyles::converters {

using namespace facebook;

namespace {

std::optional<std::string> quoteAxis(const std::string &axis) {
  auto isPrintable = [](unsigned char character) {
    return character >= 0x20 && character <= 0x7e;
  };

  if (axis.size() != 4 || !std::all_of(axis.begin(), axis.end(), isPrintable)) {
    return std::nullopt;
  }

  if (axis.find('\'') == std::string::npos) {
    return "'" + axis + "'";
  }

  if (axis.find('"') == std::string::npos) {
    return "\"" + axis + "\"";
  }

  return std::nullopt;
}

} // namespace

bool isFontVariationSettingsPropName(const std::string &propertyName) {
  return propertyName == "fontVariationSettings";
}

bool isFontVariationSettingsObject(jsi::Runtime &rt, jsi::Object &value) {
  if (value.isArray(rt) || value.isFunction(rt)) {
    return false;
  }

  auto propertyNames = value.getPropertyNames(rt);
  auto length = propertyNames.size(rt);

  for (size_t i = 0; i < length; i++) {
    auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt);

    if (!value.getProperty(rt, jsi::PropNameID::forString(rt, propertyName))
             .isNumber()) {
      return false;
    }
  }

  return true;
}

std::optional<std::string> fontVariationSettingsToString(jsi::Runtime &rt,
                                                         jsi::Object &value) {
  std::vector<std::pair<std::string, double>> axes;
  auto propertyNames = value.getPropertyNames(rt);
  auto length = propertyNames.size(rt);

  for (size_t i = 0; i < length; i++) {
    auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt);
    auto axisValue =
        value.getProperty(rt, jsi::PropNameID::forString(rt, propertyName));

    if (!axisValue.isNumber() || !std::isfinite(axisValue.asNumber())) {
      return std::nullopt;
    }

    axes.emplace_back(propertyName.utf8(rt), axisValue.asNumber());
  }

  std::sort(axes.begin(), axes.end());

  std::string result;

  for (const auto &[axis, axisValue] : axes) {
    auto quotedAxis = quoteAxis(axis);

    if (!quotedAxis.has_value()) {
      return std::nullopt;
    }

    if (!result.empty()) {
      result += ", ";
    }

    // String(value), so numbers are formatted like in JS
    result += quotedAxis.value() + " " +
              jsi::Value(axisValue).toString(rt).utf8(rt);
  }

  return result;
}

} // namespace margelo::nitro::unistyles::converters
