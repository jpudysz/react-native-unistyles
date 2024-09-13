#pragma once

#include <jsi/jsi.h>

namespace margelo::nitro::unistyles::core {

struct UnistylesState {
    UnistylesState(jsi::Runtime& rt): _rt{&rt} {}
    
private:
    jsi::Runtime* _rt;
};

}
