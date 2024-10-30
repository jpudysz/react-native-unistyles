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

    // skip only unistyles commits
    if (unistylesRootNode->hasUnistylesCommitTrait()) {
        unistylesRootNode->removeUnistylesCommitTrait();
        unistylesRootNode->addUnistylesMountTrait();

        return newRootShadowNode;
    }

    auto& registry = core::UnistylesRegistry::get();

    if (!registry.trafficController.hasUnistylesCommit()) {
        return newRootShadowNode;
    }

    auto& shadowLeafUpdates = registry.trafficController._unistylesUpdates;

    if (shadowLeafUpdates.size() == 0) {
        return newRootShadowNode;
    }

    // this is required, otherwise we end up with old shadow tree in mount hook
    registry.trafficController.stopUnistylesTraffic();

    auto affectedNodes = shadow::ShadowTreeManager::findAffectedNodes(*rootNode, shadowLeafUpdates[_rt]);

    return std::static_pointer_cast<RootShadowNode>(shadow::ShadowTreeManager::cloneShadowTree(
        *rootNode,
        shadowLeafUpdates[_rt],
        affectedNodes
    ));
}
