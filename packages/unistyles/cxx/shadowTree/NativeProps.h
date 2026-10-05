#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <cxxreact/ReactNativeVersion.h>
#include <algorithm>
#include <cstdint>
#include <memory>
#include <mutex>
#include <string>

// React Native reads ShadowNodeFamily::nativeProps_DEPRECATED from any thread
// (eg. ShadowNode::clone during main thread layout) and since 0.86.1 guards every access with nativePropsMutex
// we need to hold the same lock, otherwise mutating / replacing the folly::dynamic races with RN copying it
#if REACT_NATIVE_VERSION_MINOR > 86 || (REACT_NATIVE_VERSION_MINOR == 86 && REACT_NATIVE_VERSION_PATCH >= 1)
#define UNISTYLES_HAS_NATIVE_PROPS_MUTEX 1
#else
#define UNISTYLES_HAS_NATIVE_PROPS_MUTEX 0
#endif

namespace margelo::nitro::unistyles::shadow {

using namespace facebook::react;

inline void mergeNativeProps(const ShadowNodeFamily* family, const folly::dynamic& props) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    if (family->nativeProps_DEPRECATED && family->nativeProps_DEPRECATED->isObject()) {
        family->nativeProps_DEPRECATED->update(props);

        return;
    }

    family->nativeProps_DEPRECATED = std::make_unique<folly::dynamic>(props);
}

inline bool hasNativeProps(const ShadowNodeFamily* family) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    return family->nativeProps_DEPRECATED && family->nativeProps_DEPRECATED->isObject();
}

inline bool isSamePropValue(const std::string& propName, const folly::dynamic& value, const folly::dynamic& otherValue) {
    if (value == otherValue) {
        return true;
    }

    if (!value.isNumber() || !otherValue.isNumber()) {
        return false;
    }

    std::string lowercasePropName = propName;
    std::transform(lowercasePropName.begin(), lowercasePropName.end(), lowercasePropName.begin(), ::tolower);

    if (lowercasePropName.find("color") == std::string::npos) {
        return false;
    }

    return static_cast<uint32_t>(static_cast<int64_t>(value.asDouble())) == static_cast<uint32_t>(static_cast<int64_t>(otherValue.asDouble()));
}

inline bool hasOutdatedNativeProps(const ShadowNodeFamily* family, const folly::dynamic& props) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    if (!family->nativeProps_DEPRECATED || !family->nativeProps_DEPRECATED->isObject() || !props.isObject()) {
        return false;
    }

    auto& nativeProps = *family->nativeProps_DEPRECATED;

    for (const auto& [propName, propValue] : props.items()) {
        auto it = nativeProps.find(propName);

        if (it != nativeProps.items().end() && !isSamePropValue(propName.asString(), it->second, propValue)) {
            return true;
        }
    }

    return false;
}

}
