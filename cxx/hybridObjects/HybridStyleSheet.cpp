#include "HybridStyleSheet.h"

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, count == 1, "StyleSheet.create must be called with one argument");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.create must be called with object or function");
    
    auto styleSheetId = thisVal.asObject(rt).getProperty(rt, "__id");

    // this might happen only when hot reloading
    if (!styleSheetId.isUndefined()) {
        // styleSheetRegistry.remove(styleSheetId.asNumber());
    }
    
    return jsi::Object(rt);
}
