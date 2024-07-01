#include "StyleSheet.h"
#include <jsi/jsi.h>
#include "UpdateView.h"

using namespace facebook;

jsi::Value StyleSheet::create(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "newCreateStyleSheet"),
        1,
        [=](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            auto maybeStylesheet = arguments[0].getObject(rt);
            
            if (maybeStylesheet.isFunction(rt)) {
                // todo not implemented yet
                return jsi::Value::undefined();
            }
            
            jsi::Object& stylesheet = maybeStylesheet;

            jsi::Array propertyNames = stylesheet.getPropertyNames(rt);
            size_t length = propertyNames.size(rt);
            
            jsi::Object styles(rt);
            
            auto addNodeHostFn = jsi::Function::createFromHostFunction(
                rt,
                jsi::PropNameID::forAscii(rt, "addNode"),
                1,
                [&](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                    auto nativeTag = arguments[0].asNumber();
                    
//                    updateView(nativeTag, styles);
                    updateView(nativeTag);
                    return jsi::Value(nativeTag);
                }
            );
            
            for (size_t i = 0; i < length; i++) {
                auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
                auto propertyValue = stylesheet.getProperty(rt, propertyName.c_str()).asObject(rt);

                propertyValue.setProperty(rt, jsi::PropNameID::forUtf8(rt, "addNode"), addNodeHostFn);
                
                styles.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);
            }

            return jsi::Value(rt, styles);
        }
    );
}
