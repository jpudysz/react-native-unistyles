#include "StyleSheet.h"
#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>

using namespace facebook::react;

jsi::Value StyleSheet::create(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "create"),
        1,
        [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            auto stylesheet = arguments[0].getObject(rt);
            auto& addedStyleSheet = styleSheetRegistry.add(std::move(stylesheet));
            auto parsedStyleSheet = styleSheetRegistry.parse(addedStyleSheet);

            jsi::Array propertyNames = parsedStyleSheet.getPropertyNames(rt);
            size_t length = propertyNames.size(rt);
                
            // for every style attach addNode and removeNode host functions
            for (size_t i = 0; i < length; i++) {
                auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
                auto propertyValue = parsedStyleSheet.getProperty(rt, propertyName.c_str()).asObject(rt);
                
                auto addNodeHostFn = jsi::Function::createFromHostFunction(
                    rt,
                    jsi::PropNameID::forAscii(rt, "addNode"),
                    1,
                    [this, propertyName, &addedStyleSheet](
                        jsi::Runtime &rt,
                        const jsi::Value &thisVal,
                        const jsi::Value *arguments,
                        size_t count
                    ) -> jsi::Value {
                        auto nativeTag = arguments[0].asNumber();
                        auto it = std::find_if(
                           addedStyleSheet.styles.begin(),
                           addedStyleSheet.styles.end(),
                           [&propertyName](const Unistyle& style) {
                               return style.name == propertyName;
                           }
                        );
                        
                        if (it != addedStyleSheet.styles.end()) {
                            it->nativeTags.push_back(nativeTag);
                        }

                        return jsi::Value::undefined();
                    }
                );

                auto removeNodeHostFn = jsi::Function::createFromHostFunction(
                    rt,
                    jsi::PropNameID::forAscii(rt, "removeNode"),
                    1,
                    [this, propertyName, &addedStyleSheet](
                        jsi::Runtime &rt,
                        const jsi::Value &thisVal,
                        const jsi::Value *arguments,
                        size_t count
                    ) -> jsi::Value {
                        auto nativeTag = arguments[0].asNumber();
                        auto it = std::find_if(
                           addedStyleSheet.styles.begin(),
                           addedStyleSheet.styles.end(),
                           [&propertyName](const Unistyle& style) {
                               return style.name == propertyName;
                           }
                        );
                        
                        auto tagIt = std::find(it->nativeTags.begin(), it->nativeTags.end(), nativeTag);

                        if (tagIt != it->nativeTags.end()) {
                            it->nativeTags.erase(tagIt);
                        }

                        return jsi::Value::undefined();
                    }
                );
                
                unistyles::helpers::defineFunctionProperty(rt, propertyValue, "addNode", addNodeHostFn);
                unistyles::helpers::defineFunctionProperty(rt, propertyValue, "removeNode", removeNodeHostFn);
            }
            
            return jsi::Value(rt, parsedStyleSheet);
        }
     );
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
