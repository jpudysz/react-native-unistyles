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

    // this is React Native commit
    auto& registry = core::UnistylesRegistry::get();

    registry.trafficController.resumeUnistylesTraffic();

    // this will prevent crash when re-rendering view
    // as Unistyles has nothing to commit yet, but dependency map
    // will build all the shadow nodes
    if (!registry.trafficController.hasUnistylesCommit()) {
        return;
    }

    registry.trafficController.setHasUnistylesCommit(false);

    auto shadowLeafUpdates = this->getUnistylesUpdates();

    if (shadowLeafUpdates.size() == 0) {
        return;
    }

    shadow::ShadowTreeManager::updateShadowTree(*this->_rt, shadowLeafUpdates);
}

shadow::ShadowLeafUpdates core::UnistylesMountHook::getUnistylesUpdates() {
    auto& registry = core::UnistylesRegistry::get();
    auto parser = parser::Parser(this->_unistylesRuntime);
    auto dependencyMap = registry.buildDependencyMap(*this->_rt);

    parser.rebuildUnistylesInDependencyMap(*this->_rt, dependencyMap);

    return parser.dependencyMapToShadowLeafUpdates(dependencyMap);
}
