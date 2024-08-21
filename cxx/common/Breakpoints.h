#pragma once

#include <jsi/jsi.h>

using namespace facebook;

namespace margelo::nitro::unistyles::helpers {

using Breakpoints = std::vector<std::pair<std::string, double>>;

inline Breakpoints jsiBreakpointsToVecPairs(jsi::Runtime& rt, jsi::Value&& breakpoints) {
    Breakpoints sortedVecPairs;
    
    enumerateJSIObject(rt, breakpoints.asObject(rt), [&](const std::string& propertyName, jsi::Value& propertyValue){
        assertThat(rt, propertyValue.isNumber(), "Value for breakpoint " + std::string(propertyName) + " is not a number.");
        
        sortedVecPairs.emplace_back(propertyName, propertyValue.asNumber());
    });
    
    std::sort(sortedVecPairs.begin(), sortedVecPairs.end(), [](auto& a, auto& b){
        return a.second < b.second;
    });
    
    return sortedVecPairs;
}

inline std::string getBreakpointFromScreenWidth(int screenWidth, const Breakpoints& sortedVecPairs) {
    auto it = std::upper_bound(sortedVecPairs.cbegin(), sortedVecPairs.cend(), screenWidth, [](int width, const auto& pair) {
        return width < pair.second;
    });
    
    // return breakpoint with 0 as lowest
    if (it == sortedVecPairs.begin()) {
        return sortedVecPairs.front().first;
    }
    
    return (--it)->first;
}

}

