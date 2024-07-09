#pragma once

#include <jsi/jsi.h>

using namespace facebook;

namespace unistyles::helpers {

template<typename FunctionType>
void defineFunctionProperty(facebook::jsi::Runtime& rt, facebook::jsi::Object& object, const std::string& propName, FunctionType&& function) {
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
) -> jsi::Value {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forUtf8(rt, name),
        numberOfArguments,
        std::move(callback)
    );
}

}
