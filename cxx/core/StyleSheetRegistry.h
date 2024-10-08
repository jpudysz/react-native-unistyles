#pragma once

#include <jsi/jsi.h>
#include "StyleSheet.h"
#include "Unistyle.h"
#include "UnistylesState.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry() = default;
    virtual ~StyleSheetRegistry() = default;

    StyleSheetRegistry(const StyleSheetRegistry&) = delete;
    StyleSheetRegistry(StyleSheetRegistry&&) = delete;

    virtual std::shared_ptr<StyleSheet> addStyleSheetFromValue(jsi::Runtime& rt, jsi::Object rawStyleSheet, int unid);
    
private:
    virtual std::shared_ptr<StyleSheet> addFromFunction(jsi::Runtime& rt, int unid, jsi::Function styleSheetFn);
    virtual std::shared_ptr<StyleSheet> addFromObject(jsi::Runtime& rt, int unid, jsi::Object rawStyleSheet);
};

}
