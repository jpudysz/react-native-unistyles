#include "ShadowTreeManager.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;
using namespace facebook;

using NodesToBeChanged = std::unordered_map<const ShadowNodeFamily*, RawProps>;
using AffectedNodes = std::unordered_map<const ShadowNodeFamily*, std::unordered_set<int>>;

void shadow::ShadowTreeManager::updateShadowTree(facebook::jsi::Runtime &rt, parser::ViewUpdates& updates) {
    auto uiManager = UIManagerBinding::getBinding(rt);
    const auto &shadowTreeRegistry = uiManager->getUIManager().getShadowTreeRegistry();

    shadowTreeRegistry.enumerate([&updates, &rt](const ShadowTree& shadowTree, bool& stop){
        // we could iterate via updates and create multiple commits
        // but it can cause performance issues for hundreds of nodes
        // so let's mutate Shadow Tree in single transaction
        auto transaction = [&](const RootShadowNode& oldRootShadowNode) {
            std::unordered_map<const ShadowNodeFamily*, RawProps> nodes;

            std::for_each(updates.begin(), updates.end(), [&](parser::Update& update){
                // filter non layout updates
                if (update.hasLayoutProps) {
                    auto shadowNode = shadow::ShadowTreeManager::findShadowNode(oldRootShadowNode, update.nativeTag);
                    
                    // if there is no shadowNode, then most likely node was unmounted
                    // simply skip it, StyleSheet will get own notification soon
                    if (shadowNode) {
                        auto family = &shadowNode->getFamily();

                        nodes[family] = RawProps(rt, std::move(update.layoutProps));;
                    }
                }
            });

            auto affectedNodes = shadow::ShadowTreeManager::findAffectedNodes(oldRootShadowNode, nodes);

            return std::static_pointer_cast<RootShadowNode>(shadow::ShadowTreeManager::cloneShadowTree(oldRootShadowNode, nodes, affectedNodes));
        };

        // commit once!
        // CommitOptions:
        // enableStateReconciliation: https://reactnative.dev/architecture/render-pipeline#react-native-renderer-state-updates
        // mountSynchronously: must be true as this is update from C++ not React
        shadowTree.commit(transaction, {false, true});

        // for now we're assuming single surface, can be improved in the future
        // stop = true means stop enumerating next shadow tree
        // so in other words first shadow tree is our desired tree
        stop = true;
    });
}

std::shared_ptr<const ShadowNode> shadow::ShadowTreeManager::findShadowNode(const RootShadowNode& rootNode, const int nativeTag) {
    auto shadowNode = rootNode.ShadowNode::getChildren().at(0);

    return shadow::ShadowTreeManager::findShadowNodeByTag(shadowNode, nativeTag);
}

std::shared_ptr<const ShadowNode> shadow::ShadowTreeManager::findShadowNodeByTag(const std::shared_ptr<const ShadowNode>& shadowNode, int nativeTag) {
    if (shadowNode->getTag() == nativeTag) {
        return shadowNode;
    }

    auto& children = shadowNode->getChildren();

    for (const auto& child : children) {
        auto result = findShadowNodeByTag(child, nativeTag);

        if (result != nullptr) {
            return result;
        }
    }

    return nullptr;
}

// based on Reanimated algorithm
AffectedNodes shadow::ShadowTreeManager::findAffectedNodes(const RootShadowNode& rootNode, NodesToBeChanged& nodes) {
    AffectedNodes affectedNodes;

    // compute affected nodes (sub tree)
    std::for_each(nodes.begin(), nodes.end(), [&](const auto& pair) {
        const auto& [family, _] = pair;
        const auto familyAncestors = family->getAncestors(rootNode);

        for (const auto& [parentNode, index] : std::ranges::reverse_view(familyAncestors)) {
            const auto parentFamily = &parentNode.get().getFamily();
            auto& affectedNode = affectedNodes[parentFamily];

            affectedNode.insert(index);
        }
    });

    return affectedNodes;
}

// based on Reanimated algorithm
ShadowNode::Unshared shadow::ShadowTreeManager::cloneShadowTree(const ShadowNode &shadowNode, NodesToBeChanged& nodes, AffectedNodes& affectedNodes) {
    const auto family = &shadowNode.getFamily();

    // family's RawProps and indexes of children
    const auto rawPropsIt = nodes.find(family);
    const auto childrenIt = affectedNodes.find(family);
    auto children = shadowNode.getChildren();

    // for each affected node
    if (childrenIt != affectedNodes.end()) {
        // get all indexes of children and clone it recursively
        for (const auto index : childrenIt->second) {
            children[index] = cloneShadowTree(*children[index], nodes, affectedNodes);
        }
    }

    Props::Shared updatedProps = nullptr;

    // clone props for out target shadow node and place fresh RawProps
    if (rawPropsIt != nodes.end()) {
        PropsParserContext propsParserContext{
            shadowNode.getSurfaceId(),
            *shadowNode.getContextContainer()
        };

        updatedProps = shadowNode
            .getComponentDescriptor()
            .cloneProps(propsParserContext, shadowNode.getProps(), RawProps(rawPropsIt->second));
    }

    return shadowNode.clone({
        updatedProps ? updatedProps : ShadowNodeFragment::propsPlaceholder(),
        std::make_shared<ShadowNode::ListOfShared>(children),
        shadowNode.getState()
    });
}
