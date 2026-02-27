#pragma once

#include <react/renderer/core/ShadowNode.h>

namespace margelo::nitro::unistyles::core {

// used to distinguish Unistyles commits
// React Native uses 0-10
// Reanimated uses 27-28
constexpr shadow::ShadowNodeTraits::Trait UnistylesCommitTrait{1 << 30};

struct UnistylesCommitShadowNode: public shadow::ShadowNode {
    inline void addUnistylesCommitTrait() {
        traits_.set(UnistylesCommitTrait);
    }
};

}
