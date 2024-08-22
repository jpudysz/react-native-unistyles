#pragma once

#include <jsi/jsi.h>
#include <folly/FBVector.h>
#include "StyleSheet.h"
#include "HybridMiniRuntime.h"
#include "Helpers.h"
#include "Constants.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry(std::shared_ptr<HybridMiniRuntime> miniRuntime): miniRuntime{miniRuntime} {}

    StyleSheetRegistry(const StyleSheetRegistry&) = delete;
    StyleSheetRegistry(StyleSheetRegistry&&) = delete;
    StyleSheetRegistry& operator=(const StyleSheetRegistry&) = delete;
    StyleSheetRegistry& operator=(StyleSheetRegistry&&) = default;

    StyleSheet& add(jsi::Runtime& rt, jsi::Object rawStyleSheet);
    jsi::Object parse(jsi::Runtime &rt, const StyleSheet& styleSheet);
    void remove(unsigned int tag);

private:
    folly::fbvector<StyleSheet> styleSheets{};
    std::shared_ptr<HybridMiniRuntime> miniRuntime;

    StyleSheet& addFromFunction(jsi::Runtime& rt, unsigned int tag, jsi::Function styleSheetFn);
    StyleSheet& addFromObject(jsi::Runtime& rt, unsigned int tag, jsi::Object rawStyleSheet);
    jsi::Object unwrapStyleSheet(jsi::Runtime& rt, const StyleSheet& styleSheet);
    jsi::Object getCurrentTheme(jsi::Runtime& rt);
    jsi::Object getMiniRuntime(jsi::Runtime& rt);
};

}
