#pragma once

#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include "HybridUnistylesRuntime.h"
#include "Parser.h"
#include "ShadowTreeManager.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook::react;

struct UnistylesCommitHook : public UIManagerCommitHook {
    UnistylesCommitHook(std::shared_ptr<UIManager> uiManager, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime)
        : _unistylesRuntime{unistylesRuntime}, _uiManager{uiManager} {
            _uiManager->registerCommitHook(*this);
        }
    
    ~UnistylesCommitHook() noexcept override;

    void commitHookWasRegistered(const UIManager &uiManager) noexcept override;
    void commitHookWasUnregistered(const UIManager &uiManager) noexcept override;
    RootShadowNode::Unshared shadowTreeWillCommit(const ShadowTree &shadowTree, const RootShadowNode::Shared &oldRootShadowNode, const RootShadowNode::Unshared &newRootShadowNode) noexcept override;
    
    shadow::ShadowLeafUpdates getUnistylesUpdates();
    
private:
    std::shared_ptr<HybridUnistylesRuntime> _unistylesRuntime;
    std::shared_ptr<UIManager> _uiManager;
};

}
