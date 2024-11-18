#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"
#include "UnistylesRegistry.h"
#include "Helpers.h"
#include "HybridUnistylesRuntime.h"
#include "Constants.h"
#include "Parser.h"

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

inline static jsi::Object generateUnistylesPrototype(
    jsi::Runtime& rt,
    std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime,
    Unistyle::Shared unistyle,
    std::optional<Variants> variants,
    std::optional<jsi::Array> arguments
) {
    // add prototype metadata for createUnistylesComponent
    auto proto = jsi::Object(rt);
    auto hostFn = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forUtf8(rt, "getStyle"), 0, [unistyle, unistylesRuntime](jsi::Runtime &rt, const jsi::Value &thisValue, const jsi::Value *args, size_t count){
        auto variants = helpers::variantsToPairs(rt, thisValue.asObject(rt).getProperty(rt, "variants").asObject(rt));
        auto arguments = helpers::parseDynamicFunctionArguments(rt, thisValue.asObject(rt).getProperty(rt, "arguments").asObject(rt).asArray(rt));

        parser::Parser(unistylesRuntime).rebuildUnistyle(rt, unistyle->parent, unistyle, variants, std::make_optional<std::vector<folly::dynamic>>(arguments));

        return jsi::Value(rt, unistyle->parsedStyle.value()).asObject(rt);
    });

    proto.setProperty(rt, "getStyle", std::move(hostFn));
    proto.setProperty(rt, "arguments", arguments.has_value() ? std::move(arguments.value()) : jsi::Array(rt, 0));
    proto.setProperty(rt, "variants", variants.has_value() ? helpers::pairsToVariantsValue(rt, variants.value()) : jsi::Object(rt));
    proto.setProperty(rt, helpers::STYLE_DEPENDENCIES.c_str(), helpers::dependenciesToJSIArray(rt, unistyle->dependencies));

    return proto;
}

inline static std::vector<Unistyle::Shared> unistyleFromValue(jsi::Runtime& rt, const jsi::Value& value) {
    if (value.isNull() || !value.isObject()) {
        return {};
    }
    
    auto maybeArray = value.asObject(rt);
    
    helpers::assertThat(rt, maybeArray.isArray(rt), "Unistyles: can't retrieve Unistyle state from node as it's not an array.");
    
    std::vector<Unistyle::Shared> unistyles;
    jsi::Array unistylesArray = maybeArray.asArray(rt);
    
    helpers::iterateJSIArray(rt, unistylesArray, [&rt, &unistyles](size_t index, jsi::Value& value){
        auto obj = value.getObject(rt);

        // possible if user used React Native styles or inline styles or did spread styles
        if (!obj.hasNativeState(rt)) {
            auto exoticUnistyles = unistylesFromNonExistentNativeState(rt, obj);
            
            for (auto& exoticUnistyle: exoticUnistyles) {
                unistyles.emplace_back(exoticUnistyle);
            }
            
            return;
        }

        unistyles.emplace_back(value.getObject(rt).getNativeState<UnistyleWrapper>(rt)->unistyle);
    });
    
    return unistyles;
}

inline static jsi::Value valueFromUnistyle(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Unistyle::Shared unistyle, int tag) {
    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);

    if (unistyle->type == UnistyleType::Object) {
        jsi::Object obj = jsi::Object(rt);

        obj.setNativeState(rt, std::move(wrappedUnistyle));
        obj.setProperty(rt, helpers::NAME_STYLE_KEY.c_str(), jsi::String::createFromUtf8(rt, unistyle->styleKey));

        helpers::defineHiddenProperty(rt, obj, helpers::STYLE_DEPENDENCIES.c_str(), helpers::dependenciesToJSIArray(rt, unistyle->dependencies));
        helpers::mergeJSIObjects(rt, obj, unistyle->parsedStyle.value());

        obj.setProperty(rt, "__proto__", generateUnistylesPrototype(rt, unistylesRuntime, unistyle, std::nullopt, std::nullopt));

        return obj;
    }

    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);
    auto hostFn = jsi::Value(rt, unistyleFn->proxiedFunction.value()).asObject(rt).asFunction(rt);

    hostFn.setNativeState(rt, std::move(wrappedUnistyle));
    hostFn.setProperty(rt, helpers::NAME_STYLE_KEY.c_str(), jsi::String::createFromUtf8(rt, unistyleFn->styleKey));

    return std::move(hostFn);
}

}
