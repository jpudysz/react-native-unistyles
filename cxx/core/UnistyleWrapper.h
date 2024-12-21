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
        0,
        UnistyleType::Object,
        helpers::EXOTIC_STYLE_KEY,
        value,
        nullptr
    );

    exoticUnistyle->seal();

    return exoticUnistyle;
}

inline static std::optional<unsigned int> extractUnistyleId(const std::string& maybeUnistyleKey) {
    size_t pos = maybeUnistyleKey.find_last_of('_');

    if (pos == std::string::npos) {
        return std::nullopt;
    }

    // extract the substring after the underscore
    std::string numberPart = maybeUnistyleKey.substr(pos + 1);

    return static_cast<unsigned int>(std::stoul(numberPart));
}

inline static Unistyle::Shared unistyleFromID(jsi::Runtime& rt, jsi::Object& value) {
    auto maybeUnistyleKey = value.getProperty(rt, helpers::UNISTYLE_ID.c_str());

    if (!maybeUnistyleKey.isString()) {
        return nullptr;
    }

    auto unistyleId = extractUnistyleId(maybeUnistyleKey.asString(rt).utf8(rt));

    // ID: 0 is for exotic styles
    if (!unistyleId.has_value() || unistyleId == 0) {
        return nullptr;
    }

    auto& registry = UnistylesRegistry::get();

    return registry.getUnistyleById(rt, unistyleId.value());
}

inline static std::vector<Unistyle::Shared> unistylesFromNonExistentNativeState(jsi::Runtime& rt, jsi::Object& value) {
    auto hasUnistyleID = value.hasProperty(rt, helpers::UNISTYLE_ID.c_str());

    // return wrapped RN/inline style
    if (!hasUnistyleID) {
        return {unistyleFromStaticStyleSheet(rt, value)};
    }

    // last chance to fallback and get unistyle based on ID
    auto maybeUnistyle = unistyleFromID(rt, value);

    if (maybeUnistyle != nullptr) {
        return {maybeUnistyle};
    }

    throw jsi::JSError(rt, R"(Unistyles: Style is not bound!

You likely altered __unistyleID and we're not able to recover C++ state attached to this node.)");
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

inline static jsi::Value objectFromUnistyle(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Unistyle::Shared unistyle, Variants& variants) {
    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);
    auto unistyleID = jsi::String::createFromUtf8(rt, unistyle->styleKey + "_" + std::to_string(unistyle->unid));

    jsi::Object obj = jsi::Object(rt);

    obj.setNativeState(rt, std::move(wrappedUnistyle));
    obj.setProperty(rt, helpers::UNISTYLE_ID.c_str(), unistyleID);

    helpers::mergeJSIObjects(rt, obj, unistyle->parsedStyle.value());

    return obj;
}

inline static jsi::Value valueFromUnistyle(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Unistyle::Shared unistyle, Variants& variants) {
    if (unistyle->type == UnistyleType::Object) {
        return objectFromUnistyle(rt, unistylesRuntime, unistyle, variants);
    }

    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);
    auto unistyleID = jsi::String::createFromUtf8(rt, unistyle->styleKey + "_" + std::to_string(unistyle->unid));

    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);
    auto hostFn = jsi::Value(rt, unistyleFn->proxiedFunction.value()).asObject(rt).asFunction(rt);

    hostFn.setNativeState(rt, std::move(wrappedUnistyle));
    hostFn.setProperty(rt, helpers::UNISTYLE_ID.c_str(), unistyleID);

    return std::move(hostFn);
}

}
