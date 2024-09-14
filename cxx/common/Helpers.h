#pragma once

#include <jsi/jsi.h>

namespace margelo::nitro::unistyles::helpers {

using namespace facebook;

inline void assertThat(jsi::Runtime& rt, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(rt, message);
    }
}

}
