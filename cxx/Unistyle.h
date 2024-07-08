#include <folly/dynamic.h>
#include <folly/FBVector.h>

enum class StyleDependencies {
    Theme,
    Screen
};

class Unistyle {
    folly::dynamic diff;
    folly::dynamic style;
    folly::fbvector<int> nativeTags;
    folly::fbvector<StyleDependencies> dependencies;
    std::string name;
};
