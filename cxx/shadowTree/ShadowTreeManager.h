#pragma once

#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManager.h>
#include <ranges>
#include "ShadowLeafUpdate.h"
#include "UnistylesCommitShadowNode.h"

namespace margelo::nitro::unistyles::shadow {

using namespace facebook::react;
using namespace facebook;

using AffectedNodes = std::unordered_map<const ShadowNodeFamily *, std::unordered_set<int>>;

struct ShadowTreeManager {
    static void updateShadowTree(jsi::Runtime& rt, shadow::ShadowLeafUpdates& updates);
    static AffectedNodes findAffectedNodes(const RootShadowNode& rootNode, ShadowLeafUpdates& updates);
    static ShadowNode::Unshared cloneShadowTree(jsi::Runtime& rt, const ShadowNode &shadowNode, ShadowLeafUpdates& updates, AffectedNodes& affectedNodes);
};

}
