#pragma once

#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include "ShadowTreeManager.h"
#include "ShadowTrafficController.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook::react;

struct UnistylesCommitHook : public UIManagerCommitHook {
    UnistylesCommitHook(std::shared_ptr<UIManager> uiManager, jsi::Runtime& rt) : _uiManager{uiManager}, _rt{&rt} {
        _uiManager->registerCommitHook(*this);
    }

    ~UnistylesCommitHook() noexcept override;

    void commitHookWasRegistered(const UIManager &uiManager) noexcept override;
    void commitHookWasUnregistered(const UIManager &uiManager) noexcept override;
    RootShadowNode::Unshared shadowTreeWillCommit(const ShadowTree &shadowTree, const RootShadowNode::Shared &oldRootShadowNode, const RootShadowNode::Unshared &newRootShadowNode) noexcept override;

private:
    std::shared_ptr<UIManager> _uiManager;
    jsi::Runtime* _rt;
};

}
