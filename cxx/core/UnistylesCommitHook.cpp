#include "UnistylesCommitHook.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

core::UnistylesCommitHook::~UnistylesCommitHook() noexcept {
    _uiManager->unregisterCommitHook(*this);
}

void core::UnistylesCommitHook::commitHookWasRegistered(const UIManager &uiManager) noexcept {}
void core::UnistylesCommitHook::commitHookWasUnregistered(const UIManager &uiManager) noexcept {}

RootShadowNode::Unshared core::UnistylesCommitHook::shadowTreeWillCommit(
    const ShadowTree &shadowTree,
    const RootShadowNode::Shared &oldRootShadowNode,
    const RootShadowNode::Unshared &newRootShadowNode
) noexcept {
    RootShadowNode::Unshared rootNode = newRootShadowNode;
    auto unistylesRootNode = std::reinterpret_pointer_cast<core::UnistylesCommitShadowNode>(newRootShadowNode);

    // this is Unistyles commit, we don't need to override it
    if (unistylesRootNode->hasUnistylesCommitTrait()) {
        unistylesRootNode->removeUnistylesCommitTrait();
        unistylesRootNode->addUnistylesMountTrait();

        return newRootShadowNode;
    }

    // this is React Native / Reanimated commit
    // merge Unistyles updates before it completes
    auto& registry = core::UnistylesRegistry::get();
    auto& shadowLeafUpdates = registry.trafficController.getUpdates();

    // oops, no updates from Unistyles yet, skip it!
    if (shadowLeafUpdates.size() == 0) {
        return newRootShadowNode;
    }

    auto affectedNodes = shadow::ShadowTreeManager::findAffectedNodes(*rootNode, shadowLeafUpdates);

    registry.trafficController.stopUnistylesTraffic();

    // we have few updates, so merge it
    return std::static_pointer_cast<RootShadowNode>(shadow::ShadowTreeManager::cloneShadowTree(
        *rootNode,
        shadowLeafUpdates,
        affectedNodes
    ));
}
