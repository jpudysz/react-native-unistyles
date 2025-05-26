#include "ShadowTreeManager.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;
using namespace facebook;

using AffectedNodes = std::unordered_map<const ShadowNodeFamily*, std::unordered_set<int>>;

void shadow::ShadowTreeManager::updateShadowTree(const ShadowTreeRegistry& shadowTreeRegistry) {
    auto& registry = core::UnistylesRegistry::get();

    registry.trafficController.withLock([&](){
        auto updates = registry.trafficController.getUpdates();

        if (updates.empty()) {
            return;
        }

        shadowTreeRegistry.enumerate([&updates](const ShadowTree& shadowTree, bool& stop){
            // we could iterate via updates and create multiple commits
            // but it can cause performance issues for hundreds of nodes
            // so let's mutate Shadow Tree in single transaction
            auto transaction = [&updates](const RootShadowNode& oldRootShadowNode) {
                auto affectedNodes = shadow::ShadowTreeManager::findAffectedNodes(oldRootShadowNode, updates);

                return  std::static_pointer_cast<RootShadowNode>(shadow::ShadowTreeManager::cloneShadowTree(
                    oldRootShadowNode,
                    updates,
                    affectedNodes
                ));
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
    });
}

// based on Reanimated algorithm
// For each affected family we're gathering affected nodes (their indexes)
// Example:
//      A
//    /   \
//   B     C
//  / \
// D   E*
//    / \
//   F   G
//
// For ShadowFamily E* we will get:
//[
//  0 - because B is a first children of A,
//  1 - because E is a second children of B
//]
// A, B and E are affected now
AffectedNodes shadow::ShadowTreeManager::findAffectedNodes(const RootShadowNode& rootNode, ShadowLeafUpdates& updates) {
    AffectedNodes affectedNodes;

    for (const auto& [family, _] : updates) {
        auto familyAncestors = family->getAncestors(rootNode);

        for (auto it = familyAncestors.rbegin(); it != familyAncestors.rend(); ++it) {
            const auto& [parentNode, index] = *it;
            const auto parentFamily = &parentNode.get().getFamily();
            auto [setIt, inserted] = affectedNodes.try_emplace(parentFamily, std::unordered_set<int>{});

            setIt->second.insert(index);
        }
    }

    return affectedNodes;
}

// based on Reanimated algorithm
// clone affected nodes recursively, inject props and commit tree
ShadowNode::Unshared shadow::ShadowTreeManager::cloneShadowTree(const ShadowNode &shadowNode, ShadowLeafUpdates& updates, AffectedNodes& affectedNodes) {
    const auto family = &shadowNode.getFamily();
    const auto rawPropsIt = updates.find(family);
    const auto childrenIt = affectedNodes.find(family);

    // Only copy children if we need to update them
    std::shared_ptr<ShadowNode::ListOfShared> childrenPtr;
    const auto& originalChildren = shadowNode.getChildren();

    if (childrenIt != affectedNodes.end()) {
        auto children = originalChildren;

        for (const auto index : childrenIt->second) {
            children[index] = cloneShadowTree(*children[index], updates, affectedNodes);
        }

        childrenPtr = std::make_shared<ShadowNode::ListOfShared>(std::move(children));
    } else {
        childrenPtr = std::make_shared<ShadowNode::ListOfShared>(originalChildren);
    }

    Props::Shared updatedProps = nullptr;

    if (rawPropsIt != updates.end()) {
        const auto& componentDescriptor = shadowNode.getComponentDescriptor();
        const auto& props = shadowNode.getProps();

        PropsParserContext propsParserContext{
            shadowNode.getSurfaceId(),
            *shadowNode.getContextContainer()
        };

        folly::dynamic newProps;
        #ifdef ANDROID
            auto safeProps = rawPropsIt->second == nullptr
                ? folly::dynamic::object()
                : rawPropsIt->second;
            newProps = folly::dynamic::merge(props->rawProps, safeProps);
        #else
            newProps = rawPropsIt->second;
        #endif

        updatedProps = componentDescriptor.cloneProps(
            propsParserContext,
            props,
            RawProps(newProps)
        );
    }

    return shadowNode.clone({
        updatedProps ? updatedProps : ShadowNodeFragment::propsPlaceholder(),
        childrenPtr,
        shadowNode.getState()
    });
}
