#pragma once

namespace margelo::nitro::unistyles::core {

enum class UnistyleType {
    Object,
    DynamicFunction
};

struct Unistyle {
    UnistyleType type;
};

}
