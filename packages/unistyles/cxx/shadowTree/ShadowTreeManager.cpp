#include "ShadowTreeManager.h"
#include "PerformanceTracing.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;
using namespace facebook;

std::vector<InstanceHandle::Shared> shadow::ShadowTreeManager::updateShadowTree(jsi::Runtime& rt) {
    auto& registry = core::UnistylesRegistry::get();

    // updates pin their families, so raw pointers stay valid during the commit
    // declared outside of the lock, so the last pin is released after unlocking
    PinnedShadowLeafUpdates updates;
    std::vector<InstanceHandle::Shared> committedInstanceHandles;

    registry.trafficController.withLock([&](){
        updates = registry.trafficController.takeUpdates();

        if (updates.empty()) {
            return;
        }

        UNISTYLES_TRACE_SECTION("commit", "nodes", static_cast<int64_t>(updates.size()));

        std::unordered_map<Tag, folly::dynamic> tagToProps;
        std::unordered_map<SurfaceId, std::unordered_set<std::shared_ptr<const ShadowNodeFamily>>> familiesBySurface;

        committedInstanceHandles.reserve(updates.size());

        for (const auto& [family, update] : updates) {
            auto safeProps = update.props.isObject() ? update.props : folly::dynamic::object();

            tagToProps.insert({family->getTag(), safeProps});
            familiesBySurface[family->getSurfaceId()].insert(update.family);
            committedInstanceHandles.push_back(family->getInstanceHandle());
            shadow::mergeNativeProps(family, safeProps);
        }

        UIManagerBinding::getBinding(rt)->getUIManager().getShadowTreeRegistry().enumerate([&](const ShadowTree& shadowTree, bool&) {
            auto familiesIt = familiesBySurface.find(shadowTree.getSurfaceId());

            if (familiesIt == familiesBySurface.end()) {
                return;
            }

            shadowTree.commit([&](const RootShadowNode& oldRootShadowNode) -> RootShadowNode::Unshared {
                PropsParserContext propsParserContext{shadowTree.getSurfaceId(), *oldRootShadowNode.getContextContainer()};
                auto newRootShadowNode = oldRootShadowNode.cloneMultiple(familiesIt->second, [&](const ShadowNode& oldShadowNode, const ShadowNodeFragment& fragment) {
                    auto propsIt = tagToProps.find(oldShadowNode.getTag());

                    // an ancestor, only its children change
                    if (propsIt == tagToProps.end()) {
                        return oldShadowNode.clone({
                            .props = ShadowNodeFragment::propsPlaceholder(),
                            .children = fragment.children,
                        });
                    }

                    auto newProps = oldShadowNode.getComponentDescriptor().cloneProps(
                        propsParserContext,
                        oldShadowNode.getProps(),
                        RawProps(propsIt->second)
                    );

                    return oldShadowNode.clone({
                        .props = newProps,
                        .children = fragment.children,
                    });
                });

                return std::static_pointer_cast<RootShadowNode>(newRootShadowNode);
            }, {});
        });
    });

    return committedInstanceHandles;
}
