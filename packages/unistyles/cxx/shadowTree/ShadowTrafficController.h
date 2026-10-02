#pragma once

#import "mutex"
#import "ShadowLeafUpdate.h"

namespace margelo::nitro::unistyles::shadow {

// Like a traffic officer managing a jam, this struct ensures everything
// is synchronized within a set timeframe, controlling flow and preventing chaos.
struct ShadowTrafficController {
    inline void setUpdate(std::shared_ptr<const ShadowNodeFamily> family, folly::dynamic props) {
        // call it only within withLock!
        auto key = family.get();

        _unistylesUpdates.insert_or_assign(key, PinnedShadowLeafUpdate{std::move(family), std::move(props)});
    }

    inline PinnedShadowLeafUpdates takeUpdates() {
        // call it only within withLock!
        return std::exchange(_unistylesUpdates, {});
    }

    inline std::shared_ptr<const ShadowNodeFamily> removeShadowNode(const ShadowNodeFamily* shadowNodeFamily) {
        // call it only within withLock!
        // returns the pin, so the caller can release it after unlocking
        auto it = _unistylesUpdates.find(shadowNodeFamily);

        if (it == _unistylesUpdates.end()) {
            return nullptr;
        }

        auto family = std::move(it->second.family);

        _unistylesUpdates.erase(it);

        return family;
    }

    inline size_t getUpdatesCount() const {
        return _unistylesUpdates.size();
    }

    template <typename F>
    inline auto withLock(F&& func) {
        std::lock_guard<std::mutex> lock(_mutex);

        return std::forward<F>(func)();
    }

private:
    PinnedShadowLeafUpdates _unistylesUpdates{};

    // this struct should be accessed in thread-safe manner. Otherwise shadow tree updates
    // from different threads will break it
    std::mutex _mutex;
};

}
