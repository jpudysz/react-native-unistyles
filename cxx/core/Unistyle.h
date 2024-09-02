#pragma once

#include "string"
#include <jsi/jsi.h>
#include <folly/dynamic.h>

namespace margelo::nitro::unistyles::core {

using namespace facebook;

enum class UnistyleType {
    Object,
    DynamicFunction
};

enum class UnistyleDependency {
    Theme = 0,
    Breakpoints = 1,
    Variants = 2,
    CompoundVariants = 3,
    ColorScheme = 4,
    Rtl = 5,
    Dimensions = 6,
    Orientation = 7,
    ThemeName = 8,
    ContentSizeCategory = 9,
    Insets = 10,
    PixelRatio = 11,
    FontScale = 12
    // todo extend
};

struct DynamicFunctionMetadata {
    size_t count;
    std::vector<folly::dynamic> arguments;
};

struct Unistyle {
    Unistyle(UnistyleType type, std::string styleKey, jsi::Object& rawObject)
        : styleKey{styleKey}, type{type}, rawValue{std::move(rawObject)} {}

    Unistyle(const Unistyle&) = delete;
    Unistyle(Unistyle&& other) noexcept
        : styleKey(std::move(other.styleKey)),
          type(other.type),
          isDirty(other.isDirty),
          rawValue(std::move(other.rawValue)),
          parsedStyle(std::move(other.parsedStyle)),
          nativeTags(std::move(other.nativeTags)),
          dependencies(std::move(other.dependencies)),
          dynamicFunctionMetadata(std::move(other.dynamicFunctionMetadata)) {}

    std::string styleKey;
    UnistyleType type;
    bool isDirty = false;
    jsi::Object rawValue;
    std::optional<jsi::Object> parsedStyle;
    std::vector<int> nativeTags{};
    std::vector<UnistyleDependency> dependencies{};
    std::optional<DynamicFunctionMetadata> dynamicFunctionMetadata = std::nullopt;
};

}
