#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

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
