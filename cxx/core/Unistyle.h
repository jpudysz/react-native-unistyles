#pragma once

#include "string"
#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include "NativePlatform.h"

namespace margelo::nitro::unistyles::core {

class StyleSheet;

using namespace facebook;

enum class UnistyleType {
    Object,
    DynamicFunction
};

struct Unistyle {
    using Shared = std::shared_ptr<Unistyle>;

    Unistyle(std::string hash, UnistyleType type, std::string styleKey, jsi::Object& rawObject, std::shared_ptr<StyleSheet> styleSheet)
        : unid{hash}, styleKey{styleKey}, type{type}, rawValue{std::move(rawObject)}, parent{styleSheet} {}
    virtual ~Unistyle() = default;

    Unistyle(const Unistyle&) = delete;
    Unistyle(Unistyle&& other) = delete;

    UnistyleType type;
    std::string styleKey;
    std::string unid;
    jsi::Object rawValue;
    std::optional<jsi::Object> parsedStyle;
    std::vector<UnistyleDependency> dependencies{};
    std::shared_ptr<StyleSheet> parent;

    // defines if given unattached unistyle was modified
    // and should be recomputed when mounting new node
    bool isDirty = false;

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

    inline void addBreakpointDependency() {
        // this dependency can skip sealed check, as useVariants hook is called during React component render
        // also this is the only dependency that is not staticly deducted from Babel plugin
        auto it = std::find(this->dependencies.begin(), this->dependencies.end(), UnistyleDependency::BREAKPOINTS);

        if (it == this->dependencies.end()) {
            this->dependencies.push_back(UnistyleDependency::BREAKPOINTS);
        }
    }

    inline bool dependsOn(UnistyleDependency dependency) {
        return std::find(this->dependencies.begin(), this->dependencies.end(), dependency) != this->dependencies.end();
    }

    inline bool isSealed() {
        return this->_isSealed;
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

    UnistyleDynamicFunction(std::string hash, UnistyleType type, std::string styleKey, jsi::Object& rawObject, std::shared_ptr<StyleSheet> styleSheet)
        : Unistyle(hash, type, styleKey, rawObject, styleSheet) {}

    UnistyleDynamicFunction(const UnistyleDynamicFunction&) = delete;
    UnistyleDynamicFunction(UnistyleDynamicFunction&& other) = delete;

    std::optional<jsi::Object> unprocessedValue;
    std::optional<jsi::Function> proxiedFunction = std::nullopt;
};

}
