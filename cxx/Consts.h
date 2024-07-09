#pragma once

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
