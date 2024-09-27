#pragma once

#include "string"
#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include "Unistyles-Swift-Cxx-Umbrella.hpp"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

enum class UnistyleType {
    Object,
    DynamicFunction
};

struct DynamicFunctionMetadata {
    size_t count;
    std::vector<folly::dynamic> arguments;
};

struct Unistyle {
    using Shared = std::shared_ptr<Unistyle>;

    Unistyle(UnistyleType type, std::string styleKey, jsi::Object& rawObject)
        : styleKey{styleKey}, type{type}, rawValue{std::move(rawObject)} {}

    Unistyle(const Unistyle&) = delete;
    Unistyle(Unistyle&& other) noexcept
        : styleKey(std::move(other.styleKey)),
          type(other.type),
          rawValue(std::move(other.rawValue)),
          parsedStyle(std::move(other.parsedStyle)),
          dependencies(std::move(other.dependencies)),
          dynamicFunctionMetadata(std::move(other.dynamicFunctionMetadata)) {}

    UnistyleType type;
    std::string styleKey;
    jsi::Object rawValue;
    std::optional<jsi::Object> parsedStyle;
    std::vector<UnistyleDependency> dependencies{};

    // available for dynamic functions only
    std::optional<jsi::Function> proxiedFunction = std::nullopt;
    std::optional<DynamicFunctionMetadata> dynamicFunctionMetadata = std::nullopt;

    inline bool dependsOn(UnistyleDependency dependency) {
        return std::find(this->dependencies.begin(), this->dependencies.end(), dependency) != this->dependencies.end();
    }
};

}
