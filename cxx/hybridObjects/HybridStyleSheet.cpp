#include "HybridStyleSheet.h"

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    assertThat(rt, count == 1, "StyleSheet.create must be called with one argument");
    assertThat(rt, arguments[0].isObject(), "StyleSheet.create must be called with object or function");

    return jsi::Object(rt);
}
