#include "BackgroundLayerConverter.h"

#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstdlib>
#include <limits>
#include <optional>
#include <vector>

// React Native processes background size, position and repeat strings in JS
// (processBackgroundSize.js, processBackgroundPosition.js and
// processBackgroundRepeat.js). Its native props parser only reads the processed
// arrays, even with enableNativeCSSParsing, so shadow tree updates convert the
// strings here with the same output.
namespace margelo::nitro::unistyles::converters {

namespace {

bool isWhitespace(char character) {
  return std::isspace(static_cast<unsigned char>(character)) != 0;
}

bool isDigit(const std::string &value, size_t index) {
  return index < value.size() &&
         std::isdigit(static_cast<unsigned char>(value[index])) != 0;
}

std::string toLower(std::string value) {
  std::transform(value.begin(), value.end(), value.begin(),
                 [](unsigned char c) { return std::tolower(c); });

  return value;
}

bool endsWith(const std::string &value, const std::string &suffix) {
  return value.size() >= suffix.size() &&
         value.compare(value.size() - suffix.size(), suffix.size(), suffix) ==
             0;
}

std::string trim(const std::string &value) {
  auto start = std::find_if_not(value.begin(), value.end(), isWhitespace);
  auto end = std::find_if_not(value.rbegin(), value.rend(), isWhitespace).base();

  return start < end ? std::string(start, end) : std::string();
}

// value.split(',').map(s => s.trim())
std::vector<std::string> splitLayers(const std::string &value) {
  std::vector<std::string> layers;
  size_t start = 0;

  while (true) {
    auto end = value.find(',', start);

    layers.push_back(trim(value.substr(start, end - start)));

    if (end == std::string::npos) {
      return layers;
    }

    start = end + 1;
  }
}

// value.split(/\s+/).filter(p => p.length > 0)
std::vector<std::string> splitParts(const std::string &value) {
  std::vector<std::string> parts;
  std::string part;

  for (auto character : value) {
    if (!isWhitespace(character)) {
      part.push_back(character);

      continue;
    }

    if (!part.empty()) {
      parts.push_back(part);
      part.clear();
    }
  }

  if (!part.empty()) {
    parts.push_back(part);
  }

  return parts;
}

// JS parseFloat: the longest decimal prefix after leading whitespace, NaN
// without one
double parseFloat(const std::string &value) {
  size_t index = 0;

  while (index < value.size() && isWhitespace(value[index])) {
    index++;
  }

  auto start = index;

  if (index < value.size() && (value[index] == '+' || value[index] == '-')) {
    index++;
  }

  if (value.compare(index, 8, "Infinity") == 0) {
    return value[start] == '-' ? -std::numeric_limits<double>::infinity()
                               : std::numeric_limits<double>::infinity();
  }

  size_t digits = 0;

  while (isDigit(value, index)) {
    index++;
    digits++;
  }

  if (index < value.size() && value[index] == '.') {
    index++;

    while (isDigit(value, index)) {
      index++;
      digits++;
    }
  }

  if (digits == 0) {
    return std::numeric_limits<double>::quiet_NaN();
  }

  if (index < value.size() && (value[index] == 'e' || value[index] == 'E')) {
    auto exponentIndex = index + 1;

    if (exponentIndex < value.size() &&
        (value[exponentIndex] == '+' || value[exponentIndex] == '-')) {
      exponentIndex++;
    }

    auto exponentStart = exponentIndex;

    while (isDigit(value, exponentIndex)) {
      exponentIndex++;
    }

    if (exponentIndex > exponentStart) {
      index = exponentIndex;
    }
  }

  return std::strtod(value.substr(start, index - start).c_str(), nullptr);
}

// [ <length-percentage [0,∞]> | auto ]
std::optional<folly::dynamic> toBackgroundSizeValue(const std::string &size) {
  if (endsWith(size, "px")) {
    auto number = parseFloat(size);

    if (!std::isnan(number) && number >= 0) {
      return folly::dynamic(number);
    }
  }

  if (endsWith(size, "%") && parseFloat(size) >= 0) {
    return folly::dynamic(size);
  }

  if (size == "auto") {
    return folly::dynamic(size);
  }

  return std::nullopt;
}

// https://www.w3.org/TR/css-backgrounds-3/#typedef-bg-size
folly::dynamic parseBackgroundSize(const std::string &value) {
  folly::dynamic result = folly::dynamic::array();

  for (const auto &size : splitLayers(value)) {
    if (size.empty()) {
      return folly::dynamic::array();
    }

    auto parts = splitParts(size);

    if (parts.size() == 2) {
      auto x = toBackgroundSizeValue(toLower(parts[0]));
      auto y = toBackgroundSizeValue(toLower(parts[1]));

      if (!x.has_value() || !y.has_value()) {
        return folly::dynamic::array();
      }

      result.push_back(folly::dynamic::object("x", x.value())("y", y.value()));
    } else if (parts.size() == 1) {
      auto x = toBackgroundSizeValue(toLower(parts[0]));

      if (!x.has_value()) {
        return folly::dynamic::array();
      }

      result.push_back(folly::dynamic::object("x", x.value())("y", "auto"));
    }
  }

  return result;
}

bool isValidPosition(const std::string &position) {
  return endsWith(position, "px") || endsWith(position, "%") ||
         position == "0";
}

std::optional<folly::dynamic>
getPositionFromCSSValue(const std::string &position) {
  if (endsWith(position, "px")) {
    return folly::dynamic(parseFloat(position));
  }

  if (endsWith(position, "%")) {
    return folly::dynamic(position);
  }

  // CSS length allows 0 as a valid value
  if (position == "0") {
    return folly::dynamic(0);
  }

  return std::nullopt;
}

// https://www.w3.org/TR/css-backgrounds-3/#typedef-bg-position
folly::dynamic parseBackgroundPosition(const std::string &value) {
  folly::dynamic result = folly::dynamic::array();

  for (const auto &position : splitLayers(value)) {
    std::optional<folly::dynamic> top;
    std::optional<folly::dynamic> left;
    std::optional<folly::dynamic> right;
    std::optional<folly::dynamic> bottom;
    auto parts = splitParts(position);

    // 1. Single value syntax [ left | center | right | top | bottom |
    // <length-percentage> ]
    if (parts.size() == 1) {
      auto token1 = toLower(parts[0]);

      if (token1 == "left") {
        left = "0%";
        top = "50%";
      } else if (token1 == "center") {
        left = "50%";
        top = "50%";
      } else if (token1 == "right") {
        left = "100%";
        top = "50%";
      } else if (token1 == "top") {
        left = "50%";
        top = "0%";
      } else if (token1 == "bottom") {
        left = "50%";
        top = "100%";
      } else if (isValidPosition(token1)) {
        auto positionValue = getPositionFromCSSValue(token1);

        if (!positionValue.has_value()) {
          return folly::dynamic::array();
        }

        left = positionValue;
        top = "50%";
      }
    }

    // 2. Two value syntax [ left | center | right | <length-percentage> ] [
    // top | center | bottom | <length-percentage> ]
    if (parts.size() == 2) {
      auto token1 = toLower(parts[0]);

      if (token1 == "left") {
        left = "0%";
      } else if (token1 == "center") {
        left = "50%";
      } else if (token1 == "right") {
        left = "100%";
      } else if (token1 == "top") {
        top = "0%";
      } else if (token1 == "bottom") {
        top = "100%";
      } else if (isValidPosition(token1)) {
        auto positionValue = getPositionFromCSSValue(token1);

        if (!positionValue.has_value()) {
          return folly::dynamic::array();
        }

        left = positionValue;
      }

      auto token2 = toLower(parts[1]);

      if (token2 == "top") {
        top = "0%";
      } else if (token2 == "center") {
        top = "50%";
      } else if (token2 == "bottom") {
        top = "100%";
      } else if (token2 == "left") {
        left = "0%";
      } else if (token2 == "right") {
        left = "100%";
      } else if (isValidPosition(token2)) {
        auto positionValue = getPositionFromCSSValue(token2);

        if (!positionValue.has_value()) {
          return folly::dynamic::array();
        }

        top = positionValue;
      }
    }

    // 3. Three value syntax [ center | [ left | right ] <length-percentage>? ]
    // && [ center | [ top | bottom ] <length-percentage>? ]
    if (parts.size() == 3) {
      auto token1 = toLower(parts[0]);
      auto token2 = toLower(parts[1]);
      auto token3 = toLower(parts[2]);

      if (token1 == "center") {
        // e.g. center top 40%
        left = "50%";
        auto positionValue = getPositionFromCSSValue(token3);

        if (!positionValue.has_value()) {
          return folly::dynamic::array();
        }

        if (token2 == "top") {
          top = positionValue;
        } else if (token2 == "bottom") {
          bottom = positionValue;
        } else {
          return folly::dynamic::array();
        }
      } else if (token3 == "center") {
        // e.g. left 40% center
        top = "50%";
        auto positionValue = getPositionFromCSSValue(token2);

        if (!positionValue.has_value()) {
          return folly::dynamic::array();
        }

        if (token1 == "left") {
          left = positionValue;
        } else if (token1 == "right") {
          right = positionValue;
        } else {
          return folly::dynamic::array();
        }
      } else {
        // e.g. left 40% top, left top 10%
        std::vector<std::string> tokens = {token1, token2, token3};

        for (size_t i = 0; i < tokens.size(); i++) {
          const auto &token = tokens[i];

          if (isValidPosition(token)) {
            auto positionValue = getPositionFromCSSValue(token);

            if (!positionValue.has_value()) {
              return folly::dynamic::array();
            }

            if (i == 0) {
              continue;
            }

            const auto &previousToken = tokens[i - 1];

            if (previousToken == "left") {
              left = positionValue;
            } else if (previousToken == "right") {
              right = positionValue;
            } else if (previousToken == "top") {
              top = positionValue;
            } else if (previousToken == "bottom") {
              bottom = positionValue;
            }
          } else if (token == "left") {
            left = "0%";
          } else if (token == "right") {
            right = "0%";
          } else if (token == "top") {
            top = "0%";
          } else if (token == "bottom") {
            bottom = "0%";
          } else {
            return folly::dynamic::array();
          }
        }
      }
    }

    // 4. Four value syntax [ center | [ left | right ] <length-percentage>? ]
    // && [ center | [ top | bottom ] <length-percentage>? ]
    if (parts.size() == 4) {
      auto keyword1 = toLower(parts[0]);
      auto value1 = getPositionFromCSSValue(toLower(parts[1]));
      auto keyword2 = toLower(parts[2]);
      auto value2 = getPositionFromCSSValue(toLower(parts[3]));

      if (!value1.has_value() || !value2.has_value()) {
        return folly::dynamic::array();
      }

      if (keyword1 == "left") {
        left = value1;
      } else if (keyword1 == "right") {
        right = value1;
      }

      if (keyword2 == "top") {
        top = value2;
      } else if (keyword2 == "bottom") {
        bottom = value2;
      }
    }

    if (top.has_value() && left.has_value()) {
      result.push_back(
          folly::dynamic::object("top", top.value())("left", left.value()));
    } else if (bottom.has_value() && right.has_value()) {
      result.push_back(folly::dynamic::object("bottom", bottom.value())(
          "right", right.value()));
    } else if (top.has_value() && right.has_value()) {
      result.push_back(
          folly::dynamic::object("top", top.value())("right", right.value()));
    } else if (bottom.has_value() && left.has_value()) {
      result.push_back(folly::dynamic::object("bottom", bottom.value())(
          "left", left.value()));
    } else {
      return folly::dynamic::array();
    }
  }

  return result;
}

bool isBackgroundRepeatKeyword(const std::string &value) {
  return value == "repeat" || value == "space" || value == "round" ||
         value == "no-repeat";
}

// https://www.w3.org/TR/css-backgrounds-3/#typedef-repeat-style
folly::dynamic parseBackgroundRepeat(const std::string &value) {
  folly::dynamic result = folly::dynamic::array();

  for (const auto &repeat : splitLayers(value)) {
    if (repeat.empty()) {
      return folly::dynamic::array();
    }

    auto parts = splitParts(repeat);

    if (parts.size() == 1) {
      auto token1 = toLower(parts[0]);

      if (token1 == "repeat-x") {
        result.push_back(folly::dynamic::object("x", "repeat")("y", "no-repeat"));
      } else if (token1 == "repeat-y") {
        result.push_back(folly::dynamic::object("x", "no-repeat")("y", "repeat"));
      } else if (isBackgroundRepeatKeyword(token1)) {
        result.push_back(folly::dynamic::object("x", token1)("y", token1));
      } else {
        return folly::dynamic::array();
      }
    } else if (parts.size() == 2) {
      auto token1 = toLower(parts[0]);
      auto token2 = toLower(parts[1]);

      if (!isBackgroundRepeatKeyword(token1) ||
          !isBackgroundRepeatKeyword(token2)) {
        return folly::dynamic::array();
      }

      result.push_back(folly::dynamic::object("x", token1)("y", token2));
    }
  }

  return result;
}

} // namespace

bool isBackgroundLayerPropName(const std::string &propertyName) {
  return propertyName == "backgroundSize" ||
         propertyName == "experimental_backgroundSize" ||
         propertyName == "backgroundPosition" ||
         propertyName == "experimental_backgroundPosition" ||
         propertyName == "backgroundRepeat" ||
         propertyName == "experimental_backgroundRepeat";
}

folly::dynamic parseBackgroundLayerString(const std::string &propertyName,
                                          const std::string &value) {
  std::string singleLineValue = value;

  std::replace(singleLineValue.begin(), singleLineValue.end(), '\n', ' ');

  if (endsWith(propertyName, "ackgroundSize")) {
    return parseBackgroundSize(singleLineValue);
  }

  if (endsWith(propertyName, "ackgroundPosition")) {
    return parseBackgroundPosition(singleLineValue);
  }

  return parseBackgroundRepeat(singleLineValue);
}

} // namespace margelo::nitro::unistyles::converters
