#pragma once

#include <folly/FBVector.h>

enum class StyleDependencies {
    Theme,
    Insets,
    Noop
};

enum class UnistyleType {
    Object,
    DynamicFunction
};

static const std::string PROXY_FN_PREFIX = "__unistyles__proxy_";
static const std::string STYLE_DEPENDENCIES = "__unistyles__dependencies_";

using Variants = folly::fbvector<std::pair<std::string, std::string>>;
