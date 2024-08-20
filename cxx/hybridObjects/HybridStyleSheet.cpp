#include "HybridStyleSheet.h"

double HybridStyleSheet::getHairlineWidth() {
    auto pixelRatio = this->nativePlatform.getPixelRatio();
    auto nearestPixel = static_cast<int>(std::trunc(pixelRatio * 0.4));
    
    return nearestPixel / pixelRatio;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, count == 1, "StyleSheet.create must be called with one argument");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.create must be called with object or function");

    auto styleSheetId = thisVal.asObject(rt).getProperty(rt, "__id");

    // this might happen only when hot reloading
    if (!styleSheetId.isUndefined()) {
        styleSheetRegistry.remove(styleSheetId.asNumber());
    }
    
    jsi::Object rawStyleSheet = arguments[0].asObject(rt);
    core::StyleSheet& registeredStyleSheet = styleSheetRegistry.add(rt, std::move(rawStyleSheet));
    auto parsedStyleSheet = styleSheetRegistry.parse(rt, registeredStyleSheet);
    
    // todo
    
    return jsi::Object(rt);
}

jsi::Value HybridStyleSheet::configure(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    // todo implement me
    
    return jsi::Value::undefined();
}
