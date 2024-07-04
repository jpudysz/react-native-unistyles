#include "StyleSheet.h"
#include <jsi/jsi.h>
#include "ShadowTreeTraverser.h"
#include <react/renderer/uimanager/UIManager.h>

using namespace facebook::react;

jsi::Value StyleSheet::create(jsi::Runtime& rt, std::string fnName) {
    return HOST_FN(fnName, 1, {
        auto maybeStylesheet = arguments[0].getObject(rt);

        if (maybeStylesheet.isFunction(rt)) {
            // todo not implemented yet
            return jsi::Value::undefined();
        }

        jsi::Object& stylesheet = maybeStylesheet;

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

            propertyValue.setProperty(rt, jsi::PropNameID::forUtf8(rt, "addNode"), addNodeHostFn);
            propertyValue.setProperty(rt, jsi::PropNameID::forUtf8(rt, "removeNode"), removeNodeHostFn);

            styles.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);
        }

        return jsi::Value(rt, styles);
    });
}
