#pragma once

#include <jsi/jsi.h>

namespace margelo::nitro::unistyles::parser {

using namespace facebook;

struct Update {
    Update(int nativeTag, jsi::Value&& layoutProps, jsi::Value&& uiProps)
        : nativeTag{nativeTag}, layoutProps{std::move(layoutProps)}, uiProps{std::move(uiProps)} {}
    
    int nativeTag;
    jsi::Value layoutProps;
    jsi::Value uiProps;
    
    bool hasLayoutProps = false;
    bool hasUIProps = false;
};

using ViewUpdates = std::vector<Update>;

// keep it in sync with:
//https://github.com/facebook/react-native/blob/d687d389872f50fa11cbdd44ab3d68bdd392425b/packages/react-native/ReactCommon/react/renderer/core/RawProps.cpp#L18
inline bool isLayoutProp(const std::string& prop) {
    const static std::unordered_set<std::string> yogaStylePropNames = {{
        "direction",
        "flexDirection",
        "justifyContent",
        "alignContent",
        "alignItems",
        "alignSelf",
        "position",
        "flexWrap",
        "display",
        "flex",
        "flexGrow",
        "flexShrink",
        "flexBasis",
        "margin",
        "padding",
        "rowGap",
        "columnGap",
        "gap",
        "width",
        "height",
        "minWidth",
        "maxWidth",
        "minHeight",
        "maxHeight",
        "aspectRatio",

        // edges
        "left",
        "right",
        "top",
        "bottom",
        "start",
        "end",

        // variants of inset
        "inset",
        "insetStart",
        "insetEnd",
        "insetInline",
        "insetInlineStart",
        "insetInlineEnd",
        "insetBlock",
        "insetBlockEnd",
        "insetBlockStart",
        "insetVertical",
        "insetHorizontal",
        "insetTop",
        "insetBottom",
        "insetLeft",
        "insetRight",

        // variants of margin
        "marginStart",
        "marginEnd",
        "marginInline",
        "marginInlineStart",
        "marginInlineEnd",
        "marginBlock",
        "marginBlockStart",
        "marginBlockEnd",
        "marginVertical",
        "marginHorizontal",
        "marginTop",
        "marginBottom",
        "marginLeft",
        "marginRight",

        // variants of padding
        "paddingStart",
        "paddingEnd",
        "paddingInline",
        "paddingInlineStart",
        "paddingInlineEnd",
        "paddingBlock",
        "paddingBlockStart",
        "paddingBlockEnd",
        "paddingVertical",
        "paddingHorizontal",
        "paddingTop",
        "paddingBottom",
        "paddingLeft",
        "paddingRight"
    }};

    return yogaStylePropNames.find(prop) != yogaStylePropNames.end();
}

}
