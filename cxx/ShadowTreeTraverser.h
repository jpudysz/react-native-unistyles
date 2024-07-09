#pragma once

#include <numeric>
#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

using namespace facebook::react;

std::shared_ptr<const ShadowNode> findShadowNodeForTag(int nativeTag, const std::shared_ptr<const ShadowNode>& node) {
    if (node->getTag() == nativeTag) {
        return node;
    }

    auto& children = node->getChildren();

    for (const auto& child : children) {
        auto result = findShadowNodeForTag(nativeTag, child);

        if (result != nullptr) {
            return result;
        }
    }

    return nullptr;
}

struct ShadowTreeTraverser{
    // shadow tree is immutable, we must clone it to have a fresh copy
    ShadowTreeTraverser(const RootShadowNode& oldShadowTree) {
        this->_shadowTree = oldShadowTree.ShadowNode::clone(ShadowNodeFragment{});
    }

    ~ShadowTreeTraverser() {
        this->_shadowTree = nullptr;
    }

    ShadowTreeTraverser(const ShadowTreeTraverser& ref) = delete;

    std::shared_ptr<const ShadowNode> findShadowNode(const int);
    ShadowNode::Unshared cloneShadowNodeWithNewProps(std::shared_ptr<const ShadowNode>, RawProps&);
    void replaceShadowNode(ShadowNode::Unshared&);
    RootShadowNode::Unshared getShadowTree();

private:
    ShadowNode::Unshared _shadowTree;
};
