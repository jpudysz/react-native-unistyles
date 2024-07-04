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
        auto maybeStylesheet = arguments[0].getObject(rt);
        jsi::Object& stylesheet = maybeStylesheet;

        // todo testing dynamic functions
        if (maybeStylesheet.isFunction(rt)) {
            auto getCurrentThemeFn = rt.global().getProperty(rt, jsi::PropNameID::forUtf8(rt, "__UNISTYLES__GET_SELECTED_THEME__"));

            if (getCurrentThemeFn.isUndefined()) {
                // throw error
                return jsi::Value::undefined();
            }

            auto theme = getCurrentThemeFn.asObject(rt).asFunction(rt).call(rt, jsi::String::createFromUtf8(rt, "light"));

            stylesheet = maybeStylesheet.asFunction(rt).call(rt, std::move(theme)).asObject(rt);
        }

        jsi::Array propertyNames = stylesheet.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

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

        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = stylesheet.getProperty(rt, propertyName.c_str()).asObject(rt);


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


jsi::Value StyleSheet::addConfig(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
         rt,
         jsi::PropNameID::forAscii(rt, "addConfig"),
         1,
         [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
             auto config = arguments[0].asObject(rt);

             // convenient way, but doesn't support functions
             folly::dynamic dynamicConfig = jsi::dynamicFromValue(rt, jsi::Value(rt, config));
             folly::dynamic themes = dynamicConfig["themes"];


             if (themes.isObject()) {
                 for (const auto& pair : themes.items()) {
                     std::string themeName = pair.first.asString();
                     folly::dynamic theme = pair.second;
                     std::string typography = findInTheme(theme, {"colors", "typography"}).asString();
                 }
             }

             return jsi::Value::undefined();
        });
}
