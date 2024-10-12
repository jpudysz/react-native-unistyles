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

    // skip only unistyles commits
    if (unistylesRootNode->hasUnistylesMountTrait()) {
        unistylesRootNode->removeUnistylesMountTrait();

        return;
    }

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
