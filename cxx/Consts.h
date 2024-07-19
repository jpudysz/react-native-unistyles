#pragma once

#include <folly/FBVector.h>

enum class StyleDependency {
    Theme = 0,
    Breakpoints = 1,
    Variants = 2,
    Insets = 3,
    // todo extend
};

enum class UnistyleType {
    Object,
    DynamicFunction
};

static const std::string PROXY_FN_PREFIX = "__unistyles__proxy_";
static const std::string STYLE_DEPENDENCIES = "__unistyles__dependencies_";
static const std::string ADD_VARIANTS_FN = "__unistyles__addVariants";

using Variants = folly::fbvector<std::pair<std::string, std::string>>;
