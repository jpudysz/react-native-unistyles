#include "UnistylesMountHook.h"
#include "ShadowTreeManager.h"

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

    // React Native commit did mount
    auto& registry = core::UnistylesRegistry::get();

    // so, resume Unistyles commits
    registry.trafficController.resumeUnistylesTraffic();
}

shadow::ShadowLeafUpdates core::UnistylesMountHook::getUnistylesUpdates() {
    auto& registry = core::UnistylesRegistry::get();
    auto parser = parser::Parser(this->_unistylesRuntime);
    auto dependencyMap = registry.buildDependencyMap(*this->_rt);

    // don't rebuild dependency map, at this point it's already done

    return parser.dependencyMapToShadowLeafUpdates(dependencyMap);
}
