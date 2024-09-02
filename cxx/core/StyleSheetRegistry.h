#pragma once

#include <jsi/jsi.h>
#include <folly/FBVector.h>
#include "StyleSheet.h"
#include "HybridMiniRuntime.h"
#include "Helpers.h"
#include "UnistylesRegistry.h"
#include "UnistylesState.h"
#include "Unistyle.h"
#include "Parser.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry(std::shared_ptr<HybridMiniRuntime> miniRuntime): miniRuntime{miniRuntime} {}

    StyleSheetRegistry(const StyleSheetRegistry&) = delete;
    StyleSheetRegistry(StyleSheetRegistry&&) = delete;

    StyleSheet& add(jsi::Runtime& rt, jsi::Object rawStyleSheet);
    jsi::Object parse(jsi::Runtime &rt, StyleSheet& styleSheet);
    void remove(unsigned int tag);
    std::vector<const core::Unistyle*> getUnistylesWithDependencies(std::vector<core::UnistyleDependency>& dependencies);

private:
    folly::fbvector<StyleSheet> styleSheets{};

    StyleSheet& addFromFunction(jsi::Runtime& rt, unsigned int tag, jsi::Function styleSheetFn);
    StyleSheet& addFromObject(jsi::Runtime& rt, unsigned int tag, jsi::Object rawStyleSheet);
    jsi::Object unwrapStyleSheet(jsi::Runtime& rt, StyleSheet& styleSheet);
    std::vector<core::Unistyle>& parseToUnistyles(jsi::Runtime& rt, StyleSheet& styleSheet, jsi::Object& unwrappedStyleSheet);
    
    std::shared_ptr<HybridMiniRuntime> miniRuntime;
};

}
