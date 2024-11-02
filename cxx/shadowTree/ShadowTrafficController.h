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
        std::lock_guard<std::mutex> lock(_mutex);

        this->_canCommit = false;
    }

    inline void resumeUnistylesTraffic() {
        std::lock_guard<std::mutex> lock(_mutex);

        this->_canCommit = true;
    }

    inline shadow::ShadowLeafUpdates& getUpdates() {
        std::lock_guard<std::mutex> lock(_mutex);

        return _unistylesUpdates;
    }

    inline void setUpdates(shadow::ShadowLeafUpdates& newUpdates) {
        std::lock_guard<std::mutex> lock(_mutex);

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

    inline void restore() {
        _unistylesUpdates = {};
        _canCommit = false;
    }

private:
    std::atomic<bool> _canCommit = false;
    shadow::ShadowLeafUpdates _unistylesUpdates{};

    // this struct should be accessed in thread-safe manner. Otherwise shadow tree updates
    // from different threads will break it
    std::mutex _mutex;
};

}
