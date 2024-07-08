#include "Helpers.h"

namespace unistyles::helpers {

void defineFunctionProperty(jsi::Runtime& rt, jsi::Object& object, std::string propName, jsi::Function& function) {
    auto global = rt.global();
    auto objectConstructor = global.getPropertyAsObject(rt, "Object");
    auto defineProperty = objectConstructor.getPropertyAsFunction(rt, "defineProperty");

    jsi::Object descriptor(rt);

    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "value"), std::move(function));
    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "enumerable"), jsi::Value(false));
    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "writable"), jsi::Value(true));
    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "configurable"), jsi::Value(true));

    defineProperty.call(rt, object, jsi::String::createFromAscii(rt, propName.c_str()), descriptor);
}

}
