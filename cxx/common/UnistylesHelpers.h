#pragma once

#include <jsi/jsi.h>

using namespace facebook;

namespace margelo::nitro::unistyles::helpers {

inline void assertThat(jsi::Runtime& rt, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(rt, "[Unistyles] " + message);
    }
}

}

