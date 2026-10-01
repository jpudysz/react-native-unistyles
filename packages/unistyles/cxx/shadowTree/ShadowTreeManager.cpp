#include "ShadowTreeManager.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;
using namespace facebook;

void shadow::ShadowTreeManager::updateShadowTree(jsi::Runtime& rt) {
    auto& registry = core::UnistylesRegistry::get();

    // updates pin their families, so raw pointers stay valid during the commit
    // declared outside of the lock, so the last pin is released after unlocking
    PinnedShadowLeafUpdates updates;

    registry.trafficController.withLock([&](){
        updates = registry.trafficController.takeUpdates();

        if (updates.empty()) {
            return;
        }

        std::unordered_map<Tag, folly::dynamic> tagToProps;

        for (const auto& [family, update] : updates) {
            auto safeProps = update.props.isObject() ? update.props : folly::dynamic::object();

            tagToProps.insert({family->getTag(), safeProps});
            shadow::mergeNativeProps(family, safeProps);
        }

        UIManagerBinding::getBinding(rt)->getUIManager().updateShadowTree(std::move(tagToProps));
    });
}
