#include "StyleSheet.h"
#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include "ShadowTreeTraverser.h"
#include <react/renderer/uimanager/UIManager.h>

using namespace facebook::react;

// hide function from being enumerable
//Object.defineProperty(Object.prototype, 'hiddenFunction', {
//    value: function() {
//        console.log("This function is hidden from enumerators.");
//    },
//    enumerable: false, // This makes it non-enumerable
//    writable: true,
//    configurable: true
//});

void defineFunctionProperty(jsi::Runtime& rt, jsi::Object& object, const std::string& propName, jsi::Function& function) {
    auto global = rt.global();
    auto objectConstructor = global.getPropertyAsObject(rt, "Object");
    auto defineProperty = objectConstructor.getPropertyAsFunction(rt, "defineProperty");

    jsi::Object descriptor(rt);

    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "value"), std::move(function));
    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "enumerable"), jsi::Value(false));
    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "writable"), jsi::Value(true));
    descriptor.setProperty(rt, jsi::PropNameID::forUtf8(rt, "configurable"), jsi::Value(true));

    defineProperty.call(rt, object, jsi::String::createFromAscii(rt, propName.c_str()), descriptor);
}

jsi::Value StyleSheet::create(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
         rt,
         jsi::PropNameID::forAscii(rt, "addConfig"),
         1,
         [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            auto stylesheet = arguments[0].getObject(rt);
            int styleSheetTag = styleSheetRegistry.add(std::move(stylesheet));
           jsi::Object parsedStyleSheet = styleSheetRegistry.parse(styleSheetTag);
    

        jsi::Object styles(rt);

        auto addNodeHostFn = HOST_FN("addNode", 1, {
            auto nativeTag = arguments[0].asNumber();
//
//            std::shared_ptr<facebook::react::UIManagerBinding> uiManager = facebook::react::UIManagerBinding::getBinding(rt);
//
//            const auto &shadowTreeRegistry = uiManager->getUIManager().getShadowTreeRegistry();
//
//            jsi::Value stylesProps = jsi::Object(rt);
//            stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "flex"), jsi::Value(1));
//            stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "justifyContent"), jsi::String::createFromUtf8(rt, "center"));
//            stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "alignItems"), jsi::String::createFromUtf8(rt, "center"));
//
//            auto rawProps = facebook::react::RawProps(rt, stylesProps);
//
//            // todo assume single surface for now
//            shadowTreeRegistry.enumerate([nativeTag, &rawProps](const facebook::react::ShadowTree& shadowTree, bool& stop){
//                auto transaction = [nativeTag, &rawProps](const facebook::react::RootShadowNode& oldRootShadowNode) {
//                    auto traverser = ShadowTreeTraverser{oldRootShadowNode};
//                    auto targetNode = traverser.findShadowNode(nativeTag);
//
//                    if (!targetNode) {
//                        return std::static_pointer_cast<facebook::react::RootShadowNode>(traverser.getShadowTree());
//                    }
//
//                    auto newShadowNode = traverser.cloneShadowNodeWithNewProps(targetNode, rawProps);
//
//                    traverser.replaceShadowNode(newShadowNode);
//
//                    return traverser.getShadowTree();
//                };
//
//                shadowTree.commit(transaction, {false, true});
//                stop = true;
//            });

            return jsi::Value(nativeTag);
        });

        auto removeNodeHostFn = HOST_FN("removeNode", 1, {
            auto nativeTag = arguments[0].asNumber();

            return jsi::Value(nativeTag);
        });

             
         jsi::Array propertyNames = parsedStyleSheet.getPropertyNames(rt);
         size_t length = propertyNames.size(rt);
             
        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = parsedStyleSheet.getProperty(rt, propertyName.c_str()).asObject(rt);


            defineFunctionProperty(rt, propertyValue, "addNode", addNodeHostFn);
            defineFunctionProperty(rt, propertyValue, "removeNode", removeNodeHostFn);

            styles.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);
        }

        return jsi::Value(rt, styles);
    });
}

// testing some dynamic stuff
folly::dynamic findInTheme(const folly::dynamic& theme, const std::vector<std::string>& path) {
    const folly::dynamic* current = &theme;

    for (const auto& key : path) {
        if (!current->isObject() || current->find(key) == current->items().end()) {
            return folly::dynamic();
        }

        current = &((*current)[key]);
    }

    return *current;
}


jsi::Value StyleSheet::configure(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
         rt,
         jsi::PropNameID::forAscii(rt, "configure"),
         1,
         [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
             auto config = arguments[0].asObject(rt);

            // todo

             return jsi::Value::undefined();
        });
}
