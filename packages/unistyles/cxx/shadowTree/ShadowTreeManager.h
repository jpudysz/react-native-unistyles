#pragma once

#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManager.h>
#include <ranges>
#include "ShadowLeafUpdate.h"
#include "NativeProps.h"
#include "UnistylesRegistry.h"
#include <cxxreact/ReactNativeVersion.h>

namespace margelo::nitro::unistyles::shadow {

using namespace facebook::react;
using namespace facebook;

struct ShadowTreeManager {
    static void updateShadowTree(jsi::Runtime& rt);
};

}
