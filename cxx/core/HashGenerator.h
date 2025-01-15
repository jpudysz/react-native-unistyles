#pragma once

#include <string>
#include <atomic>

namespace margelo::nitro::unistyles::helpers {

struct HashGenerator {
    static std::atomic<unsigned int> count;
    static std::string generateHash(const std::string& input);
};

}
