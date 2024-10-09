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

struct Unistyle {
    using Shared = std::shared_ptr<Unistyle>;

    Unistyle(UnistyleType type, std::string styleKey, jsi::Object& rawObject)
        : styleKey{styleKey}, type{type}, rawValue{std::move(rawObject)} {}
    virtual ~Unistyle() = default;

    Unistyle(const Unistyle&) = delete;
    Unistyle(Unistyle&& other) = delete;

    UnistyleType type;
    std::string styleKey;
    jsi::Object rawValue;
    std::optional<jsi::Object> parsedStyle;
    std::vector<UnistyleDependency> dependencies{};

    inline void addDependency(UnistyleDependency dependency) {
        // we can't add dependencies if unistyle is sealed
        if (this->_isSealed) {
            return;
        }

        auto it = std::find(this->dependencies.begin(), this->dependencies.end(), dependency);

        if (it == this->dependencies.end()) {
            this->dependencies.push_back(dependency);
        }
    }

    inline bool dependsOn(UnistyleDependency dependency) {
        return std::find(this->dependencies.begin(), this->dependencies.end(), dependency) != this->dependencies.end();
    }

    inline void seal() {
        this->_isSealed = true;
    }

private:
    bool _isSealed = false;
};

struct UnistyleDynamicFunction: public Unistyle {
    // dynamic function must have 4 different value types
    // rawValue <- original user function
    // proxiedFunction <- host function that is a wrapper for user's original function
    // unprocessedValue <- object generated after calling proxy and user's original function
    // parsedStyle <- parsed with Unistyle's parser

    UnistyleDynamicFunction(UnistyleType type, std::string styleKey, jsi::Object& rawObject)
        : Unistyle(type, styleKey, rawObject) {}

    UnistyleDynamicFunction(const UnistyleDynamicFunction&) = delete;
    UnistyleDynamicFunction(UnistyleDynamicFunction&& other) = delete;

    std::optional<jsi::Object> unprocessedValue;
    std::optional<jsi::Function> proxiedFunction = std::nullopt;
};

}
