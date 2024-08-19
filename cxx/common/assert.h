#pragma once

#include <jsi/jsi.h>

using namespace facebook;

void assertThat(jsi::Runtime& runtime, bool condition, const std::string& message) {
    if (!condition) {
        throw jsi::JSError(runtime, "[Unistyles] " + message);
    }
}

