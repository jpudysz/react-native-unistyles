#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"
#include "UnistylesRegistry.h"
#include "Helpers.h"
#include "Constants.h"

namespace margelo::nitro::unistyles::core {

struct UnistyleWrapper: public jsi::NativeState {
    explicit UnistyleWrapper(Unistyle::Shared unistyle)
        : unistyle(std::move(unistyle)) {}

    ~UnistyleWrapper() override;

    Unistyle::Shared unistyle;
};

inline static Unistyle::Shared unistyleFromStaticStyleSheet(jsi::Runtime& rt, jsi::Object& value) {
    auto exoticUnistyle = std::make_shared<Unistyle>(
        UnistyleType::Object,
        helpers::EXOTIC_STYLE_KEY,
        value,
        nullptr
    );

    exoticUnistyle->seal();

    return exoticUnistyle;
}


inline static std::vector<Unistyle::Shared> unistylesFromNonExistentNativeState(jsi::Runtime& rt, jsi::Object& value) {
    auto hasUnistyleName = value.hasProperty(rt, helpers::NAME_STYLE_KEY.c_str());

    // return wrapped RN/inline style
    if (!hasUnistyleName) {
        return {unistyleFromStaticStyleSheet(rt, value)};
    }

    throw jsi::JSError(rt, R"(Unistyles: Style is not bound!
    
Potential reasons:
- You likely used the spread operator on a Unistyle style outside of a JSX component
    
If you need to merge styles, do it within the style prop of your JSX component:
    
style={{...styles.container, ...styles.otherProp}}
or 
style={[styles.container, styles.otherProp]}

If you pass computed style prop to component use array syntax:

customStyleProp={[styles.container, styles.otherProp]}
    
Copying a Unistyle style outside of a JSX element will remove its internal C++ state, leading to unexpected behavior.)");
}

inline static std::vector<Unistyle::Shared> unistyleFromValue(jsi::Runtime& rt, const jsi::Value& value) {
    if (value.isNull()) {
        return {};
    }

    auto obj = value.getObject(rt);

    // possible if user used React Native styles or inline styles or did spread styles
    if (!obj.hasNativeState(rt)) {
        return unistylesFromNonExistentNativeState(rt, obj);
    }

    return {value.getObject(rt).getNativeState<UnistyleWrapper>(rt)->unistyle};
}

inline static jsi::Value valueFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle, int tag) {
    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);

    if (unistyle->type == UnistyleType::Object) {
        jsi::Object obj = jsi::Object(rt);
       
        obj.setNativeState(rt, std::move(wrappedUnistyle));
        obj.setProperty(rt, helpers::NAME_STYLE_KEY.c_str(), jsi::String::createFromUtf8(rt, unistyle->styleKey));
        
        helpers::mergeJSIObjects(rt, obj, unistyle->parsedStyle.value());

        return obj;
    }

    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);
    auto hostFn = jsi::Value(rt, unistyleFn->proxiedFunction.value()).asObject(rt).asFunction(rt);

    hostFn.setNativeState(rt, std::move(wrappedUnistyle));
    hostFn.setProperty(rt, helpers::NAME_STYLE_KEY.c_str(), jsi::String::createFromUtf8(rt, unistyleFn->styleKey));
    
    return std::move(hostFn);
}

}
