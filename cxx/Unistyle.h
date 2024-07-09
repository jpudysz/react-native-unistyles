#pragma once

#include <folly/dynamic.h>
#include <folly/FBVector.h>

enum class StyleDependencies {
    Theme,
    Screen
};

enum class UnistyleType {
    Object,
    DynamicFunction
};

struct Unistyle {
    std::string name;
    UnistyleType type;
    folly::dynamic diff {};
    folly::dynamic style;
    folly::fbvector<int> nativeTags {};
    folly::fbvector<StyleDependencies> dependencies;

    // for dynamic functions
    std::optional<size_t> count;
    std::optional<folly::dynamic> arguments;

    Unistyle(
      UnistyleType type,
      std::string name,
      folly::dynamic style,
      folly::fbvector<StyleDependencies> deps
    ): name{name}, style{std::move(style)}, dependencies(std::move(deps)), type{type} {}

private:
    void computeMetadata();
};
