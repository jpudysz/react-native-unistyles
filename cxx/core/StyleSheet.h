#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

enum class StyleSheetType {
    Static,
    Themable,
    ThemableWithMiniRuntime
};

struct StyleSheet {
    StyleSheet(unsigned int tag, StyleSheetType type, jsi::Object rawValue): tag{tag}, type{type}, rawValue{std::move(rawValue)} {};
    
    StyleSheet(const StyleSheet&) = delete;
    StyleSheet(StyleSheet&& other) noexcept : tag{other.tag}, type{other.type}, rawValue{std::move(other.rawValue)} {
        other.tag = -1;
    }
    StyleSheet& operator=(StyleSheet&& other) noexcept {
        if (this == &other) {
            tag = other.tag;
            type = other.type;
            rawValue = std::move(other.rawValue);
            other.tag = -1;
        }

        return *this;
    }
    
    unsigned int tag;
    StyleSheetType type;
    jsi::Object rawValue;
    std::vector<core::Unistyle> unistyles{};
};

}
