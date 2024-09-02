#include "ShadowTreeTraverser.h"

using namespace margelo::nitro::unistyles::shadow;
using namespace facebook::react;

using SharedShadowNode = const std::shared_ptr<const ShadowNode>;
using AncestorPair = std::pair<std::reference_wrapper<const ShadowNode>, int>;

// we need to locate our ShadowNode based on __nativeTag
// todo: can we optimize it? maybe it's better to store ShadowFamily?
std::shared_ptr<const ShadowNode> ShadowTreeTraverser::findShadowNode(const int nativeTag) {
    return findShadowNodeForTag(nativeTag, _shadowTree);
}

// Function clones given shadowNode with new RawProps
// in other to do that we need to find first ancestor's children position
// Example:
//        A
//      /   \
//     B     C
//    / \
//   D   E*
//      / \
//     F   G
//
// to clone ShadowNode E, we need to find all ancestors e.g:
//[
//  {A, 0},  // B is the first child (index 0) of A
//  {B, 1},  // E is the second child (index 1) of B
//]
// and get the ShadowNode based on closest ancestor B[1] = E*
ShadowNode::Unshared ShadowTreeTraverser::cloneShadowNodeWithNewProps(SharedShadowNode shadowNode, RawProps& props) {
    auto& shadowNodeFamily = shadowNode->getFamily();
    auto ancestors = shadowNodeFamily.getAncestors(*_shadowTree);
    auto& parent = ancestors.back();
    auto& targetShadowNode = parent.first.get().getChildren().at(parent.second);
    auto& componentDescriptor = targetShadowNode->getComponentDescriptor();

    PropsParserContext parserContext {
        targetShadowNode->getSurfaceId(),
        *targetShadowNode->getContextContainer()
    };
    auto newProps = componentDescriptor.cloneProps(parserContext, targetShadowNode->getProps(), std::move(props));
    auto newNode = targetShadowNode->clone({
        newProps,
        ShadowNodeFragment::childrenPlaceholder(),
        targetShadowNode->getState()
    });

    return newNode;
}

// Function copies entire ancestor path from target node to root
// Example:
//      A
//    /   \
//   B     C
//  / \
// D   E*
//    / \
//   F   G
//
// to replace ShadowNode E, we need to clone all ancestors (B->A)
void ShadowTreeTraverser::replaceShadowNode(ShadowNode::Unshared& newShadowNode) {
    auto& shadowNodeFamily = newShadowNode->getFamily();
    auto ancestors = shadowNodeFamily.getAncestors(*_shadowTree);

    _shadowTree = std::accumulate(
        ancestors.rbegin(),
        ancestors.rend(),
        newShadowNode,
        [](ShadowNode::Unshared targetShadowNode, const AncestorPair& ancestorPair) {
            auto& ancestor = ancestorPair.first.get();
            auto childIndex = ancestorPair.second;
            auto& children = const_cast<ShadowNode::ListOfShared&>(ancestor.getChildren());

            children[childIndex] = targetShadowNode;

            return ancestor.clone({
                ShadowNodeFragment::propsPlaceholder(),
                std::make_shared<ShadowNode::ListOfShared>(children),
                ancestor.getState()
            });
        }
    );
}

// copied, modified shadowTree
RootShadowNode::Unshared ShadowTreeTraverser::getShadowTree() {
    return std::static_pointer_cast<RootShadowNode>(_shadowTree);
}
