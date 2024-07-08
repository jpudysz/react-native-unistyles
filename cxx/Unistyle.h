#include <folly/dynamic.h>
#include <folly/FBVector.h>

enum class StyleDependencies {
    Theme,
    Screen
};

struct Unistyle {
    std::string name;
    folly::dynamic diff {};
    folly::dynamic style;
    folly::fbvector<int> nativeTags {};
    folly::fbvector<StyleDependencies> dependencies;
 
    Unistyle(
      std::string name,
      folly::dynamic style,
      folly::fbvector<StyleDependencies> deps
    ): name{name}, style{std::move(style)}, dependencies(std::move(deps)) {}
};
