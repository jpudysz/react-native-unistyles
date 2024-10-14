#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"
#include "Helpers.h"
#include "Constants.h"

namespace margelo::nitro::unistyles::core {

struct UnistyleWrapper: public jsi::NativeState {
    explicit UnistyleWrapper(Unistyle::Shared unistyle)
        : unistyle(std::move(unistyle)) {}

    ~UnistyleWrapper() override;

    Unistyle::Shared unistyle;
};

inline static Unistyle::Shared unistyleFromValue(jsi::Runtime& rt, const jsi::Value& value) {
    if (value.isNull()) {
        return nullptr;
    }

    auto obj = value.getObject(rt);

    if (!obj.hasNativeState(rt)) {
        throw jsi::JSError(rt, R"(Unistyles: Style is not bound!

Potential reasons:
- You likely used the spread operator on a Unistyle style outside of a JSX component
- You're mixing React Native's StyleSheet styles with Unistyles styles

If you need to merge styles, do it within the style prop of your JSX component:

style={{...styles.container, ...styles.otherProp}} or style={[styles.container, styles.otherProp]}

Copying a Unistyle style outside of a JSX element will remove its internal C++ state, leading to unexpected behavior.

If you're mixing React Native and Unistyle StyleSheet styles, move your static styles into Unistyles to avoid conflicts.)");
    }

    return obj.getNativeState<UnistyleWrapper>(rt)->unistyle;
}

inline static jsi::Value valueFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle) {
    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);

    if (unistyle->type == UnistyleType::Object) {
        jsi::Object obj = jsi::Object(rt);

        obj.setNativeState(rt, std::move(wrappedUnistyle));
        helpers::defineHiddenProperty(rt, obj, helpers::UNISTYLES_ID.c_str(), unistyle->styleKey);

        helpers::mergeJSIObjects(rt, obj, unistyle->parsedStyle.value());

        return obj;
    }

    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);
    auto hostFn = jsi::Value(rt, unistyleFn->proxiedFunction.value()).asObject(rt).asFunction(rt);

    hostFn.setNativeState(rt, std::move(wrappedUnistyle));
    helpers::defineHiddenProperty(rt, hostFn, helpers::UNISTYLES_ID.c_str(), unistyleFn->styleKey);

    return std::move(hostFn);
}

}
