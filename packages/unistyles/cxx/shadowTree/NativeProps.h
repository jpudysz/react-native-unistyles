#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <cxxreact/ReactNativeVersion.h>
#include <memory>
#include <mutex>

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

inline void resetNativeProps(const ShadowNodeFamily* family) {
#if UNISTYLES_HAS_NATIVE_PROPS_MUTEX
    std::lock_guard<std::mutex> lock(family->nativePropsMutex);
#endif

    family->nativeProps_DEPRECATED.reset();
}

}
