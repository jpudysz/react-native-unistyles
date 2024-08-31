#pragma once

#include <jsi/jsi.h>
#include <unordered_set>

using namespace facebook;

namespace margelo::nitro::unistyles::helpers {

inline void assertThat(jsi::Runtime& rt, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(rt, message);
    }
}

inline void enumerateJSIObject(jsi::Runtime& rt, const jsi::Object& obj, std::function<void(const std::string& propertyName, jsi::Value& propertyValue)> callback) {
    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());

        callback(propertyName, propertyValue);
    }
}

inline void iterateJSIArray(jsi::Runtime& rt, const jsi::Array& array, std::function<void(size_t, jsi::Value&)> callback) {
    size_t length = array.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto value = array.getValueAtIndex(rt, i);

        callback(i, value);
    }
}

inline bool vecContainsKeys(std::vector<std::string>& vec, std::vector<std::string>&& keys) {
    std::unordered_set<std::string> availableKeys(keys.begin(), keys.end());

    for (const auto& key : vec) {
        availableKeys.erase(key);

        if (availableKeys.empty()) {
            return true;
        }
    }

    return false;
}

template<typename PropertyType>
inline void defineHiddenProperty(jsi::Runtime& rt, jsi::Object& object, const std::string& propName, PropertyType&& property) {
    auto global = rt.global();
    auto objectConstructor = global.getPropertyAsObject(rt, "Object");
    auto defineProperty = objectConstructor.getPropertyAsFunction(rt, "defineProperty");

    facebook::jsi::Object descriptor(rt);

    if constexpr (std::is_same_v<std::decay_t<PropertyType>, jsi::Function>) {
        descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "value"), std::forward<PropertyType>(property));
    } else {
        descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "value"), property);
    }

    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "enumerable"), facebook::jsi::Value(false));
    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "writable"), facebook::jsi::Value(true));
    descriptor.setProperty(rt, facebook::jsi::PropNameID::forUtf8(rt, "configurable"), facebook::jsi::Value(true));

    defineProperty.call(rt, object, facebook::jsi::String::createFromAscii(rt, propName.c_str()), descriptor);
}

inline bool isPlatformColor(jsi::Runtime& rt, jsi::Object& maybePlatformColor) {
    auto isIOSPlatformColor = maybePlatformColor.hasProperty(rt, "semantic") && maybePlatformColor.getProperty(rt, "semantic").isObject();

    if (isIOSPlatformColor) {
        return true;
    }

    // Android
    return maybePlatformColor.hasProperty(rt, "resource_paths") && maybePlatformColor.getProperty(rt, "resource_paths").isObject();
}

inline jsi::Object& mergeJSIObjects(jsi::Runtime&rt, jsi::Object& obj1, jsi::Object& obj2) {
    helpers::enumerateJSIObject(rt, obj2, [&](const std::string& propertyName, jsi::Value& propertyValue){
        obj1.setProperty(rt, propertyName.c_str(), propertyValue);
    });

    return obj1;
}

}

