#include "UnistylesMountHook.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

core::UnistylesMountHook::~UnistylesMountHook() noexcept {
    _uiManager->unregisterMountHook(*this);
}

void core::UnistylesMountHook::shadowTreeDidMount(RootShadowNode::Shared const &rootShadowNode, double mountTime) noexcept {
    auto rootNode = std::const_pointer_cast<RootShadowNode>(rootShadowNode);
    auto unistylesRootNode = std::reinterpret_pointer_cast<core::UnistylesCommitShadowNode>(rootNode);

    // if this is Unistyles commit, do nothing
    if (unistylesRootNode->hasUnistylesMountTrait()) {
        unistylesRootNode->removeUnistylesMountTrait();

        return;
    }

    // this is React Native or Reanimated commit
    // one more time merge Unistyles changes
    auto& registry = core::UnistylesRegistry::get();

    if (!registry.trafficController.shouldStop()) {
        shadow::ShadowTreeManager::updateShadowTree(this->_uiManager->getShadowTreeRegistry());
    }
}
