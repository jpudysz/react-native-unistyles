#pragma once

#include <jsi/jsi.h>
#include <memory>
#include "HybridUnistylesRuntime.h"

namespace margelo::nitro::unistyles::shadow {

using namespace facebook;

// Diagnostics for tests (react-native-unistyles/diagnostics), never commits anything
struct ShadowTreeDiagnostics {
    // rebuilds styles of every linked node with its own arguments, variants and current theme,
    // and compares them with props committed to the shadow tree
    static jsi::Value verify(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime);
};

}
