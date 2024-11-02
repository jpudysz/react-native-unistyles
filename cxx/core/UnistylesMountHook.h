#pragma once

#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include "ShadowTreeManager.h"
#include "HybridUnistylesRuntime.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook::react;

struct UnistylesMountHook : public UIManagerMountHook {
    UnistylesMountHook(std::shared_ptr<UIManager> uiManager, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
        : _uiManager{uiManager}, _unistylesRuntime{unistylesRuntime} {
        _uiManager->registerMountHook(*this);
    }

    ~UnistylesMountHook() noexcept override;

    void shadowTreeDidMount(RootShadowNode::Shared const &rootShadowNode, double mountTime) noexcept override;

private:
    std::shared_ptr<UIManager> _uiManager;
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
};

}
