#include "StyleSheet.h"
#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>

using namespace facebook::react;
using namespace unistyles::helpers;

// Base Unistyles function that
// - registers stylesheet
// - attaches addNode, removeNode functions
// - returns pardes stylesheet to React (on first render)
jsi::Value StyleSheet::create(jsi::Runtime& rt, std::string fnName) {
    return createHostFunction(rt, "create", 1, [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
        assertThat(rt, count == 1, "StyleSheet.create must be called with one argument");
        assertThat(rt, arguments[0].isObject(), "StyleSheet.create must be called with object or function");
        
        auto rawStyleSheet = arguments[0].asObject(rt);
        auto& registeredStyleSheet = styleSheetRegistry.add(std::move(rawStyleSheet));
        auto parsedStyleSheet = styleSheetRegistry.dereferenceStyleSheet(registeredStyleSheet);
        
        enumerateJSIObject(rt, parsedStyleSheet, [&](const std::string& propertyName, jsi::Object& propertyValue){
            auto addNodeHostFn = createHostFunction(rt, "addNode", 1, [&registeredStyleSheet, propertyName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
                auto nativeTag = arguments[0].asNumber();
                auto it = std::find_if(
                   registeredStyleSheet.styles.begin(),
                   registeredStyleSheet.styles.end(),
                   [&propertyName](const Unistyle& style) {
                       return style.name == propertyName;
                   }
                );
                
                if (it != registeredStyleSheet.styles.end()) {
                    it->nativeTags.push_back(nativeTag);
                }

                return jsi::Value::undefined();
            });

            auto removeNodeHostFn = createHostFunction(rt, "removeNode", 1, [&registeredStyleSheet, propertyName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
                auto nativeTag = arguments[0].asNumber();
                auto it = std::find_if(
                   registeredStyleSheet.styles.begin(),
                   registeredStyleSheet.styles.end(),
                   [&propertyName](const Unistyle& style) {
                       return style.name == propertyName;
                   }
                );
                
                auto tagIt = std::find(it->nativeTags.begin(), it->nativeTags.end(), nativeTag);

                if (tagIt != it->nativeTags.end()) {
                    it->nativeTags.erase(tagIt);
                }

                return jsi::Value::undefined();
            });
            
            defineFunctionProperty(rt, propertyValue, "addNode", addNodeHostFn);
            defineFunctionProperty(rt, propertyValue, "removeNode", removeNodeHostFn);
        });
        
        return jsi::Value(rt, parsedStyleSheet);
    });
}

jsi::Value StyleSheet::configure(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "configure"),
        1,
        [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            auto config = arguments[0].asObject(rt);

            // todo parse config

            return jsi::Value::undefined();
        }
    );
}
