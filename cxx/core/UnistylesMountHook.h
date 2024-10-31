#pragma once

#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include "ShadowTreeManager.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook::react;

struct UnistylesMountHook : public UIManagerMountHook {
    UnistylesMountHook(std::shared_ptr<UIManager> uiManager, jsi::Runtime& rt) : _uiManager{uiManager}, _rt{&rt} {
        _uiManager->registerMountHook(*this);
    }

    ~UnistylesMountHook() noexcept override;

    void shadowTreeDidMount(RootShadowNode::Shared const &rootShadowNode, double mountTime) noexcept override;

private:
    std::shared_ptr<UIManager> _uiManager;
    jsi::Runtime* _rt;
};

}
