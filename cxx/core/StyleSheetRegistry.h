#pragma once

#include <jsi/jsi.h>
#include <folly/FBVector.h>
#include "StyleSheet.h"
#include "HybridMiniRuntime.h"
#include "Helpers.h"
#include "UnistylesRegistry.h"
#include "UnistylesState.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry() = default;

    StyleSheetRegistry(const StyleSheetRegistry&) = delete;
    StyleSheetRegistry(StyleSheetRegistry&&) = delete;

    StyleSheet& add(jsi::Runtime& rt, jsi::Object rawStyleSheet);
    jsi::Object parse(jsi::Runtime &rt, const StyleSheet& styleSheet);
    void remove(unsigned int tag);

private:
    folly::fbvector<StyleSheet> styleSheets{};

    StyleSheet& addFromFunction(jsi::Runtime& rt, unsigned int tag, jsi::Function styleSheetFn);
    StyleSheet& addFromObject(jsi::Runtime& rt, unsigned int tag, jsi::Object rawStyleSheet);
    jsi::Object unwrapStyleSheet(jsi::Runtime& rt, const StyleSheet& styleSheet);
};

}
