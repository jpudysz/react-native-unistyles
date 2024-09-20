#pragma once

#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManager.h>
#include <ranges>
#include "ViewUpdate.h"

namespace margelo::nitro::unistyles::shadow {

using namespace facebook::react;
using namespace facebook;

using NodesToBeChanged = std::unordered_map<const ShadowNodeFamily*, std::vector<RawProps>>;
using AffectedNodes = std::unordered_map<const ShadowNodeFamily *, std::unordered_set<int>>;

struct ShadowTreeManager {
    static void updateShadowTree(jsi::Runtime& rt, parser::ViewUpdates& updates);
    static std::shared_ptr<const ShadowNode> findShadowNode(const RootShadowNode& rootNode, const int nativeTag);
    static std::shared_ptr<const ShadowNode> findShadowNodeByTag(const std::shared_ptr<const ShadowNode>& shadowNode, int nativeTag);
    static AffectedNodes findAffectedNodes(const RootShadowNode& rootNode, NodesToBeChanged& nodes);
    static ShadowNode::Unshared cloneShadowTree(const ShadowNode &shadowNode, NodesToBeChanged& nodes, AffectedNodes& affectedNodes);
};

}
