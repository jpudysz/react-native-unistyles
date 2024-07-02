#include "StyleSheet.h"
#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/core/ShadowNodeFragment.h>

using namespace facebook;

std::pair<std::shared_ptr<const facebook::react::ShadowNode>, std::shared_ptr<const facebook::react::ShadowNode>>
findShadowNodeAndParentForTag(int nativeTag, const std::shared_ptr<const facebook::react::ShadowNode>& node,
                              const std::shared_ptr<const facebook::react::ShadowNode>& parent = nullptr) {
    if (node->getTag() == nativeTag) {
        return {node, parent};
    }

    auto& children = node->getChildren();
    
    for (const auto& child : children) {
        auto result = findShadowNodeAndParentForTag(nativeTag, child, node);

        if (result.first != nullptr) {
            return result;
        }
    }
    
    return {nullptr, nullptr};
}

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

                    std::shared_ptr<facebook::react::UIManagerBinding> uiManager = facebook::react::UIManagerBinding::getBinding(rt);

                    const auto &shadowTreeRegistry = uiManager->getUIManager().getShadowTreeRegistry();

                    jsi::Value stylesProps = jsi::Object(rt);
                    stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "flex"), jsi::Value(1));
                    stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "justifyContent"), jsi::String::createFromUtf8(rt, "center"));
                    stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "alignItems"), jsi::String::createFromUtf8(rt, "center"));
                    stylesProps.asObject(rt).setProperty(rt, jsi::PropNameID::forUtf8(rt, "backgroundColor"),jsi::String::createFromUtf8(rt, "#000000"));

                    auto rawProps = facebook::react::RawProps(rt, stylesProps);
                    
                    // todo assume single surface for now
                    shadowTreeRegistry.enumerate([nativeTag, &rawProps](const facebook::react::ShadowTree& shadowTree, bool& stop){
                        auto transaction = [nativeTag, &rawProps](const facebook::react::RootShadowNode& oldRootShadowNode)->facebook::react::RootShadowNode::Unshared {
                            auto rootNode = oldRootShadowNode.ShadowNode::clone(facebook::react::ShadowNodeFragment{});
                            auto [targetNode, parentNode] = findShadowNodeAndParentForTag(nativeTag, rootNode);
                            
                            if (!targetNode) {
                                return std::static_pointer_cast<facebook::react::RootShadowNode>(rootNode);
                            }
                            
                            auto& componentDescriptor = targetNode->getComponentDescriptor();
                            facebook::react::PropsParserContext parserContext{
                                targetNode->getSurfaceId(),
                                *targetNode->getContextContainer()
                            };
                            auto newProps = componentDescriptor.cloneProps(parserContext, targetNode->getProps(), std::move(rawProps));
                            auto newNode = targetNode->clone({
                                newProps,
                                std::make_shared<facebook::react::ShadowNode::ListOfShared>(targetNode->getChildren()),
                                targetNode->getState()
                            });
                            
                            if (!parentNode->getSealed()) {
                                auto& parentNodeNonConst = const_cast<facebook::react::ShadowNode&>(*parentNode);
                                parentNodeNonConst.replaceChild(*targetNode, std::move(newNode));

                                static_cast<facebook::react::YogaLayoutableShadowNode *>(&parentNodeNonConst)
                                          ->updateYogaChildren();
                            }
        
                            return std::static_pointer_cast<facebook::react::RootShadowNode>(rootNode);
                        };

                        shadowTree.commit(transaction, {false, true});
                        
                        stop = true;
                    });

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
