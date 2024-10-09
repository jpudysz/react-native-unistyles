#pragma once

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>
#include <unordered_set>

using namespace facebook;

namespace margelo::nitro::unistyles::helpers {

using Variants = std::vector<std::pair<std::string, std::string>>;

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

template<typename PropertyType>
inline bool vecContainsKeys(std::vector<PropertyType>& vec, std::vector<PropertyType>&& keys) {
    std::unordered_set<PropertyType> availableKeys(keys.begin(), keys.end());
    
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

inline jsi::Object& mergeJSIObjects(jsi::Runtime&rt, jsi::Object& obj1, jsi::Object& obj2) {
    helpers::enumerateJSIObject(rt, obj2, [&](const std::string& propertyName, jsi::Value& propertyValue){
        obj1.setProperty(rt, propertyName.c_str(), propertyValue);
    });

    return obj1;
}

inline void iterateJSIArray(jsi::Runtime& rt, const jsi::Array& array, std::function<void(size_t, jsi::Value&)> callback) {
    size_t length = array.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto value = array.getValueAtIndex(rt, i);

        callback(i, value);
    }
}

inline bool isPlatformColor(jsi::Runtime& rt, jsi::Object& maybePlatformColor) {
    auto isIOSPlatformColor = maybePlatformColor.hasProperty(rt, "semantic") && maybePlatformColor.getProperty(rt, "semantic").isObject();

    if (isIOSPlatformColor) {
        return true;
    }

    // Android
    return maybePlatformColor.hasProperty(rt, "resource_paths") && maybePlatformColor.getProperty(rt, "resource_paths").isObject();
}

inline Variants variantsToPairs(jsi::Runtime& rt, jsi::Object&& variants) {
    Variants pairs{};

    helpers::enumerateJSIObject(rt, variants, [&](const std::string& variantName, jsi::Value& variantValue){
        if (variantValue.isUndefined() || variantValue.isNull()) {
            return;
        }

        if (variantValue.isBool()) {
            pairs.emplace_back(std::make_pair(variantName, variantValue.asBool() ? "true" : "false"));

            return;
        }

        if (variantValue.isString()) {
            pairs.emplace_back(std::make_pair(variantName, variantValue.asString(rt).utf8(rt)));
        }
    });

    return pairs;
}

inline std::vector<folly::dynamic> parseDynamicFunctionArguments(jsi::Runtime& rt, jsi::Array& arguments) {
    std::vector<folly::dynamic> parsedArgument{};
    size_t count = arguments.size(rt);

    parsedArgument.reserve(count);

    for (size_t i = 0; i < count; i++) {
        jsi::Value arg = arguments.getValueAtIndex(rt, i);

        if (arg.isBool()) {
            parsedArgument.push_back(folly::dynamic(arg.asBool()));

            continue;
        }

        if (arg.isNumber()) {
            parsedArgument.push_back(folly::dynamic(arg.asNumber()));

            continue;
        }

        if (arg.isString()) {
            parsedArgument.push_back(folly::dynamic(arg.asString(rt).utf8(rt)));

            continue;
        }

        if (arg.isUndefined()) {
            parsedArgument.push_back(folly::dynamic());

            continue;
        }

        if (arg.isNull()) {
            parsedArgument.push_back(folly::dynamic(nullptr));

            continue;
        }

        if (!arg.isObject()) {
            continue;;
        }

        auto argObj = arg.asObject(rt);

        // allow arrays and objects too
        if (!argObj.isFunction(rt) && !argObj.isArrayBuffer(rt)) {
            parsedArgument.push_back(jsi::dynamicFromValue(rt, arg));

            continue;
        }
    }

    return parsedArgument;
}

}
