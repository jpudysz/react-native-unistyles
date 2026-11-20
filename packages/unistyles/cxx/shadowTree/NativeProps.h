#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <cxxreact/ReactNativeVersion.h>
#include <algorithm>
#include <cstdint>
#include <memory>
#include <mutex>
#include <string>
#include <type_traits>

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

// React Native nightlies hold the native props in a ShadowNodeFamily::NativeProps_DEPRECATED struct,
// next to the props that already include them, so that cloning a node doesn't apply them again
// earlier versions hold the folly::dynamic itself, so these helpers detect the type at compile time
using FamilyNativeProps = std::remove_reference_t<decltype(*std::declval<ShadowNodeFamily>().nativeProps_DEPRECATED)>;

template <typename NativeProps>
inline folly::dynamic& getNativePropsDynamic(NativeProps& nativeProps) {
    if constexpr (requires { nativeProps.props; }) {
        return nativeProps.props;
    } else {
        return nativeProps;
    }
}

// React Native only skips applying native props to a clone whose props already include them,
// after changing them every node needs them applied again (eg. frozen nodes Unistyles doesn't commit)
template <typename NativeProps>
inline void markNativePropsChanged(NativeProps& nativeProps) {
    if constexpr (requires { nativeProps.appliedProps; }) {
        nativeProps.appliedProps = nullptr;
    }
}

inline folly::dynamic* getNativeProps(const ShadowNodeFamily* family) {
    if (!family->nativeProps_DEPRECATED) {
        return nullptr;
    }

    return &getNativePropsDynamic(*family->nativeProps_DEPRECATED);
}

inline void mergeNativeProps(const ShadowNodeFamily* family, const folly::dynamic& props) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    auto nativeProps = getNativeProps(family);

    if (nativeProps && nativeProps->isObject()) {
        nativeProps->update(props);
        markNativePropsChanged(*family->nativeProps_DEPRECATED);

        return;
    }

    family->nativeProps_DEPRECATED = std::make_unique<FamilyNativeProps>(props);
}

inline bool hasNativeProps(const ShadowNodeFamily* family) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    auto nativeProps = getNativeProps(family);

    return nativeProps && nativeProps->isObject();
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

    auto nativePropsPtr = getNativeProps(family);

    if (!nativePropsPtr || !nativePropsPtr->isObject() || !props.isObject()) {
        return false;
    }

    auto& nativeProps = *nativePropsPtr;

    for (const auto& [propName, propValue] : props.items()) {
        auto it = nativeProps.find(propName);

        if (it != nativeProps.items().end() && !isSamePropValue(propName.asString(), it->second, propValue)) {
            return true;
        }
    }

    return false;
}

inline bool hasCommittedNativeProps(const ShadowNodeFamily* family, const folly::dynamic& props) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    auto nativePropsPtr = getNativeProps(family);

    if (!nativePropsPtr || !nativePropsPtr->isObject() || !props.isObject()) {
        return false;
    }

    auto& nativeProps = *nativePropsPtr;

    for (const auto& [propName, propValue] : props.items()) {
        auto it = nativeProps.find(propName);

        // never pushed by Unistyles, only React knows what is committed
        if (it == nativeProps.items().end() || !isSamePropValue(propName.asString(), it->second, propValue)) {
            return false;
        }
    }

    return true;
}

}
