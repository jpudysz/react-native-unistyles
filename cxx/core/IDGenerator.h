#include <atomic>

namespace margelo::nitro::unistyles::helpers {

struct IDGenerator {
    IDGenerator(unsigned int start = 1): _currentID(start) {}

    int next() {
        return _currentID.fetch_add(1, std::memory_order_relaxed);
    }

private:
    std::atomic<unsigned int> _currentID;
};

}
