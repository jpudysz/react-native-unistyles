#include "ShadowTreeManager.h"
#include "PerformanceTracing.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;
using namespace facebook;

namespace {

using ShadowNodeChildren = std::vector<std::shared_ptr<const ShadowNode>>;

// rebuilds `ours`, cloned from `base`, on top of `theirs`, which another commit made from `base`
// clones only the nodes that both commits changed, returns nullptr if the other commit added, removed or moved a node
template <typename MergeProps>
std::shared_ptr<const ShadowNodeChildren> rebaseChildren(
    const ShadowNodeChildren& ours,
    const ShadowNodeChildren& base,
    const ShadowNodeChildren& theirs,
    const MergeProps& mergeProps
) {
    if (theirs.size() != base.size()) {
        return nullptr;
    }

    auto children = std::make_shared<ShadowNodeChildren>(theirs);

    for (size_t index = 0; index < base.size(); index++) {
        // only this commit changed the subtree
        if (theirs[index] == base[index]) {
            (*children)[index] = ours[index];

            continue;
        }

        // only the other commit changed it
        if (ours[index] == base[index]) {
            continue;
        }

        if (!ShadowNode::sameFamily(*theirs[index], *base[index])) {
            return nullptr;
        }

        auto grandchildren = rebaseChildren(
            ours[index]->getChildren(),
            base[index]->getChildren(),
            theirs[index]->getChildren(),
            mergeProps
        );

        if (!grandchildren) {
            return nullptr;
        }

        (*children)[index] = theirs[index]->clone({
            .props = mergeProps(*ours[index], *base[index], *theirs[index]),
            .children = grandchildren,
        });
    }

    return children;
}

}

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

            // children of the root that the last attempt started from, and of the root it built
            std::shared_ptr<const ShadowNodeChildren> baseChildren;
            std::shared_ptr<const ShadowNodeChildren> clonedChildren;

            shadowTree.commit([&](const RootShadowNode& oldRootShadowNode) -> RootShadowNode::Unshared {
                PropsParserContext propsParserContext{shadowTree.getSurfaceId(), *oldRootShadowNode.getContextContainer()};

                // another thread committed during the last attempt (e.g. a Reanimated frame)
                // cloning every node again keeps losing while those commits continue, until ShadowTree::commit gives up,
                // so a retry keeps the last attempt's clones and clones again only the nodes the other commit changed too
                if (clonedChildren) {
                    auto mergeProps = [&](const ShadowNode& ours, const ShadowNode& base, const ShadowNode& theirs) -> Props::Shared {
                        auto propsIt = tagToProps.find(theirs.getTag());

                        // an ancestor keeps the other commit's props
                        if (propsIt == tagToProps.end()) {
                            return ShadowNodeFragment::propsPlaceholder();
                        }

                        // the other commit kept the props that this commit parsed on top of
                        if (theirs.getProps() == base.getProps()) {
                            return ours.getProps();
                        }

                        return theirs.getComponentDescriptor().cloneProps(
                            propsParserContext,
                            theirs.getProps(),
                            RawProps(propsIt->second)
                        );
                    };

                    auto rebasedChildren = rebaseChildren(*clonedChildren, *baseChildren, oldRootShadowNode.getChildren(), mergeProps);

                    if (rebasedChildren) {
                        baseChildren = std::make_shared<const ShadowNodeChildren>(oldRootShadowNode.getChildren());
                        clonedChildren = rebasedChildren;

                        return std::make_shared<RootShadowNode>(oldRootShadowNode, ShadowNodeFragment{
                            .props = ShadowNodeFragment::propsPlaceholder(),
                            .children = rebasedChildren,
                        });
                    }
                }

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

                if (newRootShadowNode) {
                    baseChildren = std::make_shared<const ShadowNodeChildren>(oldRootShadowNode.getChildren());
                    clonedChildren = std::make_shared<const ShadowNodeChildren>(newRootShadowNode->getChildren());
                }

                return std::static_pointer_cast<RootShadowNode>(newRootShadowNode);
            }, {});
        });
    });

    return committedInstanceHandles;
}
