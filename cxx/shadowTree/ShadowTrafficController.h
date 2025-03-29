#pragma once

#import "mutex"
#import "ShadowLeafUpdate.h"

namespace margelo::nitro::unistyles::shadow {

// Like a traffic officer managing a jam, this struct ensures everything
// is synchronized within a set timeframe, controlling flow and preventing chaos.
struct ShadowTrafficController {
    inline bool shouldStop() {
        return !_canCommit;
    }

    inline void stopUnistylesTraffic() {
        this->_canCommit = false;
    }

    inline void resumeUnistylesTraffic() {
        this->_canCommit = true;
    }

    inline shadow::ShadowLeafUpdates& getUpdates() {
        // call it only within withLock!
        return _unistylesUpdates;
    }

    inline void setUpdates(shadow::ShadowLeafUpdates& newUpdates) {
        // call it only within withLock!
        auto& targetUpdates = _unistylesUpdates;

        // this is important as overriding updates may skip some interim changes
        // Unistyles emits different events so this will make sure that everything is synced
        std::for_each(newUpdates.begin(), newUpdates.end(), [&targetUpdates](auto& pair){
            if (targetUpdates.contains(pair.first)) {
                targetUpdates[pair.first] = std::move(pair.second);

                return;
            }

            targetUpdates.emplace(pair.first, std::move(pair.second));
        });
    }

    inline void removeShadowNode(const ShadowNodeFamily* shadowNodeFamily) {
        // call it only within withLock!
        if (_unistylesUpdates.contains(shadowNodeFamily)) {
            _unistylesUpdates.erase(shadowNodeFamily);
        }
    }

    inline void restore() {
        // call it only within withLock!

        _unistylesUpdates = {};
        _canCommit = false;
    }

    template <typename F>
    inline auto withLock(F&& func) {
        std::lock_guard<std::mutex> lock(_mutex);

        return std::forward<F>(func)();
    }

private:
    std::atomic<bool> _canCommit = false;
    shadow::ShadowLeafUpdates _unistylesUpdates{};

    // this struct should be accessed in thread-safe manner. Otherwise shadow tree updates
    // from different threads will break it
    std::mutex _mutex;
};

}
