#pragma once

#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include "HybridUnistylesRuntime.h"
#include "Parser.h"
#include "ShadowTreeManager.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook::react;

struct UnistylesMountHook : public UIManagerMountHook {
    UnistylesMountHook(std::shared_ptr<UIManager> uiManager, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
        : _unistylesRuntime{unistylesRuntime}, _uiManager{uiManager} {
            _uiManager->registerMountHook(*this);
        }

    ~UnistylesMountHook() noexcept override;

    void shadowTreeDidMount(RootShadowNode::Shared const &rootShadowNode, double mountTime) noexcept override;

    shadow::ShadowLeafUpdates getUnistylesUpdates();

private:
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::shared_ptr<UIManager> _uiManager;
};

}
