#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"

namespace margelo::nitro::unistyles::core {

using Variants = std::vector<std::pair<std::string, std::string>>;

struct UnistyleData {
    UnistyleData(Unistyle::Shared unistyle, const Variants& variants, std::vector<folly::dynamic>& arguments, std::optional<std::string> uniquePressableId)
        : unistyle{unistyle}, variants(std::move(variants)), dynamicFunctionMetadata{std::move(arguments)}, pressableId{std::move(uniquePressableId)} {}

    UnistyleData(const UnistyleData&) = delete;
    UnistyleData(UnistyleData&& other) = delete;

    core::Unistyle::Shared unistyle;
    core::Variants variants;
    std::optional<jsi::Object> parsedStyle = std::nullopt;
    std::optional<std::vector<folly::dynamic>> dynamicFunctionMetadata = std::nullopt;
    std::optional<std::string> pressableId = std::nullopt;
};

}
