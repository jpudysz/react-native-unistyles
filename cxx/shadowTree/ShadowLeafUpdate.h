#pragma once

#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>

namespace margelo::nitro::unistyles::shadow {

using namespace facebook;
using namespace facebook::react;

using ShadowLeafUpdates = std::unordered_map<const ShadowNodeFamily*, RawProps>;

}
