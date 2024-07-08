#include <folly/FBVector.h>
#include <jsi/jsi.h>
#include "Unistyle.h"

using namespace facebook;

enum class StyleSheetType {
    Static,
    Themable,
    ThemableWithMiniRuntime
};

class StyleSheetHolder {
    int tag;
    StyleSheetType type;
    jsi::Object value;
    folly::fbvector<Unistyle> styles {};
    
public:
    StyleSheetHolder(
        int tag,
        StyleSheetType type,
        jsi::Object value
    ): tag{tag}, type{type}, value{std::move(value)} {}
};
