#pragma once

#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include <memory>
#include <react/renderer/uimanager/UIManager.h>

namespace margelo::nitro::unistyles::shadow {

using namespace facebook;
using namespace facebook::react;

// translates Unistyles changes to unified shadow tree changes
using ShadowLeafUpdates = std::unordered_map<const ShadowNodeFamily*, folly::dynamic>;

struct PinnedShadowLeafUpdate {
    std::shared_ptr<const ShadowNodeFamily> family;
    folly::dynamic props;
};

using PinnedShadowLeafUpdates = std::unordered_map<const ShadowNodeFamily*, PinnedShadowLeafUpdate>;

}
