#pragma once

#include "string"
#include <jsi/jsi.h>

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
    // todo extend
};

struct Unistyle {
    Unistyle(std::string styleKey, UnistyleType type, jsi::Object& rawValue)
        : styleKey{styleKey}, type{type}, rawValue{std::move(rawValue)} {}

    Unistyle(const Unistyle&) = delete;
    Unistyle(const Unistyle&&) = delete;
    
    std::string styleKey;
    UnistyleType type;
    bool isDirty = false;
    jsi::Object rawValue;
    std::optional<jsi::Object> parsedStyle;
    std::vector<int> nativeTags{};
    std::vector<UnistyleDependency> dependencies{};
};

}
