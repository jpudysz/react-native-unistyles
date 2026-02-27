#include "ShadowTreeManager.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;
using namespace facebook;

using AffectedNodes = std::unordered_map<const ShadowNodeFamily*, std::unordered_set<int>>;

void shadow::ShadowTreeManager::updateShadowTree(jsi::Runtime& rt) {
    auto& registry = core::UnistylesRegistry::get();

    registry.trafficController.withLock([&](){
        auto updates = registry.trafficController.getUpdates();

        if (updates.empty()) {
            return;
        }

#if REACT_NATIVE_VERSION_MINOR >= 81
        std::unordered_map<Tag, folly::dynamic> tagToProps;

        for (const auto& [family, props] : updates) {
            tagToProps.insert({family->getTag(), props});

            auto* mutableFamily = const_cast<ShadowNodeFamily*>(family);

            if (mutableFamily->nativeProps_DEPRECATED) {
                mutableFamily->nativeProps_DEPRECATED->update(props);
            } else {
                mutableFamily->nativeProps_DEPRECATED = std::make_unique<folly::dynamic>(props);
            }
        }

        UIManagerBinding::getBinding(rt)->getUIManager().updateShadowTree(std::move(tagToProps));
#else
        const auto& shadowTreeRegistry = UIManagerBinding::getBinding(rt)->getUIManager().getShadowTreeRegistry();

        shadowTreeRegistry.enumerate([&updates](const ShadowTree& shadowTree, bool& stop){
            // we could iterate via updates and create multiple commits
            // but it can cause performance issues for hundreds of nodes
            // so let's mutate Shadow Tree in single transaction
            auto transaction = [&updates](const RootShadowNode& oldRootShadowNode) {
                auto affectedNodes = shadow::ShadowTreeManager::findAffectedNodes(oldRootShadowNode, updates);

                for (const auto& [family, props] : updates) {
                    // Merge props to fix glitches caused by REA updates
                    auto* mutableFamily = const_cast<ShadowNodeFamily*>(family);

                    if (mutableFamily->nativeProps_DEPRECATED) {
                        mutableFamily->nativeProps_DEPRECATED->update(props);
                    } else {
                        mutableFamily->nativeProps_DEPRECATED = std::make_unique<folly::dynamic>(props);
                    }
                }

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
#endif
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

Props::Shared shadow::ShadowTreeManager::computeUpdatedProps(const ShadowNode &shadowNode, ShadowLeafUpdates& updates) {
    const auto family = &shadowNode.getFamily();
    const auto rawPropsIt = updates.find(family);

    if (rawPropsIt == updates.end()) {
        return ShadowNodeFragment::propsPlaceholder();
    }

    const auto& componentDescriptor = shadowNode.getComponentDescriptor();
    const auto& props = shadowNode.getProps();

    PropsParserContext propsParserContext{
        shadowNode.getSurfaceId(),
        *shadowNode.getContextContainer()
    };

    folly::dynamic newProps = rawPropsIt->second == nullptr
        ? folly::dynamic::object()
        : rawPropsIt->second;

    return componentDescriptor.cloneProps(
        propsParserContext,
        props,
        RawProps(newProps)
    );
}

// based on Reanimated algorithm
// clone affected nodes recursively, inject props and commit tree
std::shared_ptr<ShadowNode> shadow::ShadowTreeManager::cloneShadowTree(const ShadowNode &shadowNode, ShadowLeafUpdates& updates, AffectedNodes& affectedNodes) {
    const auto family = &shadowNode.getFamily();
    const auto childrenIt = affectedNodes.find(family);

    // Only copy children if we need to update them
    std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> childrenPtr;
    const auto& originalChildren = shadowNode.getChildren();

    if (childrenIt != affectedNodes.end()) {
        auto children = originalChildren;

        for (const auto index : childrenIt->second) {
            children[index] = cloneShadowTree(*children[index], updates, affectedNodes);
        }

        childrenPtr = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(std::move(children));
    } else {
        childrenPtr = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(originalChildren);
    }

    Props::Shared updatedProps = computeUpdatedProps(shadowNode, updates);

    return shadowNode.clone({
        .props = updatedProps,
        .children = childrenPtr,
        .state = shadowNode.getState()
    });
}
