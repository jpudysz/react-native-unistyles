#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include "Consts.h"

using namespace facebook;

namespace unistyles::helpers {

template<typename FunctionType>
void defineFunctionProperty(jsi::Runtime& rt, jsi::Object& object, const std::string& propName, FunctionType&& function) {
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

void enumerateJSIObject(jsi::Runtime& rt, const jsi::Object& obj, std::function<void(const std::string& propertyName, jsi::Object& propertyValue)> callback) {
    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str()).asObject(rt);

        callback(propertyName, propertyValue);
    }
}

using JSIFunction = std::function<jsi::Value(jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t)>;

auto createHostFunction(
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

// todo extend me
static StyleDependencies getDependencyForString(const std::string& dep) {
    if (dep == "$0") {
        return StyleDependencies::Theme;
    }

    if (dep == "$1") {
        return StyleDependencies::Insets;
    }

    return StyleDependencies::Noop;
}

void assertThat(jsi::Runtime& runtime, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(runtime, "[Unistyles] " + message);
    }
}

folly::dynamic getIfExists(folly::dynamic& object, std::string key) {
    auto it = object.find(key);

    if (it != object.items().end()) {
        return it->second;
    }

    return nullptr;
}

jsi::Object& mergeJSIObjects(jsi::Runtime&rt, jsi::Object& obj1, jsi::Object& obj2) {
    jsi::Array propertyNames = obj2.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj2.getProperty(rt, propertyName.c_str());

        obj1.setProperty(rt, propertyName.c_str(), propertyValue);
    }
    
    return obj1;
}

bool containsAllPairs(jsi::Runtime& rt, Variants& variants, jsi::Object& compoundVariant) {
    if (variants.empty()) {
        return false;
    }
    
    for (auto it = variants.cbegin(); it != variants.cend(); ++it) {
        auto variantKey = it->first;
        auto variantValue = it->second;
        
        if (!compoundVariant.hasProperty(rt, variantKey.c_str())) {
            return false;
        }
        
        if (compoundVariant.getProperty(rt, variantKey.c_str()).asString(rt).utf8(rt) != variantValue) {
            return false;
        }
    }
    
    return true;
}

}
