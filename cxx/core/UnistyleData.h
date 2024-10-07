#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"

namespace margelo::nitro::unistyles::core {

using Variants = std::vector<std::pair<std::string, std::string>>;

struct UnistyleData {
    UnistyleData(Unistyle::Shared unistyle, const Variants& variants)
        : unistyle{unistyle}, variants(std::move(variants)) {}

    UnistyleData(const UnistyleData&) = delete;
    UnistyleData(UnistyleData&& other): unistyle{other.unistyle}, variants(std::move(other.variants)) {}

    core::Unistyle::Shared unistyle;
    core::Variants variants;
    std::optional<jsi::Object> parsedStyle = std::nullopt;
};

}
