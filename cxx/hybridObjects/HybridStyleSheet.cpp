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
    helpers::assertThat(rt, count == 1, "StyleSheet.configure must be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.configure must be called with configuration object.");
    
    auto config = arguments[0].asObject(rt);
    
    helpers::enumerateJSIObject(rt, config, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "settings") {
            helpers::assertThat(rt, propertyValue.isObject(), "Settings passed to StyleSheet.configure must be an object.");
            
            return this->parseSettings(rt, propertyValue.asObject(rt));
        }
        
        if (propertyName == "breakpoints") {
            helpers::assertThat(rt, propertyValue.isObject(), "Breakpoints passed to StyleSheet.configure must be an object.");
            
            return this->parseBreakpoints(rt, propertyValue.asObject(rt));
        }
        
        if (propertyName == "themes") {
            helpers::assertThat(rt, propertyValue.isObject(), "Themes passed to StyleSheet.configure must be an object.");
            
            return this->parseThemes(rt, propertyValue.asObject(rt));
        }
        
        helpers::assertThat(rt, false, "StyleSheet.configure object has unexpected key: " + std::string(propertyName));
    });
    
    return jsi::Value::undefined();
}

void HybridStyleSheet::parseSettings(jsi::Runtime &rt, jsi::Object settings) {
    helpers::enumerateJSIObject(rt, settings, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "adaptiveThemes") {
            helpers::assertThat(rt, propertyValue.isBool(), "The adaptiveThemes configuration must be of boolean type.");
            
            this->unistylesRuntime->hasAdaptiveThemes = propertyValue.asBool();
            
            return;
        }
        
        if (propertyName == "initialTheme") {
            helpers::assertThat(rt, propertyValue.isString(), "The initialTheme configuration must be of string type.");
            
            this->unistylesRuntime->initialTheme = propertyValue.asString(rt).utf8(rt);
            
            return;
        }
        
        helpers::assertThat(rt, false, "StyleSheet.configure object has unexpected key for settings: " + std::string(propertyName));
    });
}

void HybridStyleSheet::parseBreakpoints(jsi::Runtime &rt, jsi::Object breakpoints){
    helpers::enumerateJSIObject(rt, breakpoints, [&](const std::string& propertyName, jsi::Value& propertyValue){
        // todo
    });
}

void HybridStyleSheet::parseThemes(jsi::Runtime &rt, jsi::Object themes) {
    helpers::enumerateJSIObject(rt, themes, [&](const std::string& propertyName, jsi::Value& propertyValue){
        //todo
    });
}
