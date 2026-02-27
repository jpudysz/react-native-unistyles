#pragma once

#include <jsi/jsi.h>
#include "Helpers.h"
#include "Parser.h"
#include "HostUnistyle.h"
#include "UnistyleWrapper.h"

namespace margelo::nitro::unistyles::core {

inline jsi::Object toRNStyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> stylesheet, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Variants&& variants) {
    auto style = std::make_shared<core::HostUnistyle>(stylesheet, unistylesRuntime, variants);
    auto styleHostObject = jsi::Object::createFromHostObject(rt, style);

    return styleHostObject;
}

}
