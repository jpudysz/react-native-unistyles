#include "HashGenerator.h"
#include <sstream>
#include <iomanip>
#include <functional>

namespace margelo::nitro::unistyles::helpers {

std::atomic<unsigned int> HashGenerator::count(0);

std::string HashGenerator::generateHash(const std::string& input) {
    std::hash<std::string> stringHasher;
    uint64_t inputHash = stringHasher(input);

    unsigned int counterValue = count.fetch_add(1, std::memory_order_relaxed);
    uint64_t combinedHash = inputHash ^ (static_cast<uint64_t>(counterValue) << 32);

    std::stringstream ss;
    ss << std::hex << std::setfill('0') << std::setw(8) << (combinedHash & 0xFFFFFFFF);

    return "unistyles_" + ss.str();
}

}
