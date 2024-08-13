#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include "Consts.h"

using namespace facebook;

namespace unistyles::helpers {

template<typename FunctionType>
inline void defineFunctionProperty(jsi::Runtime& rt, jsi::Object& object, const std::string& propName, FunctionType&& function) {
    auto global = rt.global();
    auto objectConstructor = global.getPropertyAsObject(rt, "Object");
    auto defineProperty = objectConstructor.getPropertyAsFunction(rt, "defineProperty");

    facebook::jsi::Object descriptor(rt);
    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "value"), std::forward<FunctionType>(function));
    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "enumerable"), facebook::jsi::Value(false));
    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "writable"), facebook::jsi::Value(true));
    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "configurable"), facebook::jsi::Value(true));

    defineProperty.call(rt, object, facebook::jsi::String::createFromAscii(rt, propName.c_str()), descriptor);
}

inline void enumerateJSIObject(jsi::Runtime& rt, const jsi::Object& obj, std::function<void(const std::string& propertyName, jsi::Object& propertyValue)> callback) {
    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str()).asObject(rt);

        callback(propertyName, propertyValue);
    }
}

using JSIFunction = std::function<jsi::Value(jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t)>;

inline auto createHostFunction(
    jsi::Runtime& rt,
    const std::string& name,
    size_t numberOfArguments,
    JSIFunction&& callback
) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forUtf8(rt, name),
        numberOfArguments,
        std::move(callback)
    );
}

inline void assertThat(jsi::Runtime& runtime, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(runtime, "[Unistyles] " + message);
    }
}

inline folly::dynamic getIfExists(folly::dynamic& object, std::string key) {
    auto it = object.find(key);

    if (it != object.items().end()) {
        return it->second;
    }

    return nullptr;
}

inline jsi::Object& mergeJSIObjects(jsi::Runtime&rt, jsi::Object& obj1, jsi::Object& obj2) {
    jsi::Array propertyNames = obj2.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj2.getProperty(rt, propertyName.c_str());

        obj1.setProperty(rt, propertyName.c_str(), propertyValue);
    }

    return obj1;
}

inline bool containsAllPairs(jsi::Runtime& rt, Variants& variants, jsi::Object& compoundVariant) {
    if (variants.empty()) {
        return false;
    }

    jsi::Array propertyNames = compoundVariant.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);
    size_t allConditions = compoundVariant.hasProperty(rt, "styles")
        ? length - 1
        : length;

    if (allConditions != variants.size()) {
        return false;
    }

    for (auto it = variants.cbegin(); it != variants.cend(); ++it) {
        auto variantKey = it->first;
        auto variantValue = it->second;

        if (!compoundVariant.hasProperty(rt, variantKey.c_str())) {
            return false;
        }

        auto property = compoundVariant.getProperty(rt, variantKey.c_str());
        auto propertyName = property.isBool()
            ? (property.asBool() ? "true" : "false")
            : property.asString(rt).utf8(rt);

        if (propertyName != variantValue) {
            return false;
        }
    }

    return true;
}

inline bool isPlatformColor(jsi::Runtime& rt, jsi::Object& maybePlatformColor) {
    auto isIOSPlatformColor = maybePlatformColor.hasProperty(rt, "semantic") && maybePlatformColor.getProperty(rt, "semantic").isObject();

    if (isIOSPlatformColor) {
        return true;
    }

    // Android
    return maybePlatformColor.hasProperty(rt, "resource_paths") && maybePlatformColor.getProperty(rt, "resource_paths").isObject();
}

}
