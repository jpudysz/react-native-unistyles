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
        helpers::HashGenerator::generateHash(helpers::EXOTIC_STYLE_KEY),
        UnistyleType::Object,
        helpers::EXOTIC_STYLE_KEY,
        value,
        nullptr
    );

    exoticUnistyle->seal();

    return exoticUnistyle;
}

inline static std::vector<std::string> getUnistylesHashKeys(jsi::Runtime& rt, jsi::Object& object) {
    std::vector<std::string> matchingKeys{};
    const std::string prefix = "unistyles-";
    
    auto propertyNames = object.getPropertyNames(rt);
    size_t length = propertyNames.length(rt);
    
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).getString(rt);
        std::string key = propertyName.utf8(rt);
        
        if (key.compare(0, prefix.length(), prefix) == 0) {
            matchingKeys.push_back(key);
        }
    }
    
    return matchingKeys;
}

inline static std::vector<Unistyle::Shared> unistylesFromHashKeys(jsi::Runtime& rt, jsi::Object& object, std::vector<std::string> keys) {
    std::vector<Unistyle::Shared> unistyles{};
    auto& registry = UnistylesRegistry::get();
    
    for (auto& key: keys) {
        unistyles.emplace_back(registry.getUnistyleById(rt, key));
    }

    return unistyles;
}

inline static std::vector<Unistyle::Shared> unistylesFromNonExistentNativeState(jsi::Runtime& rt, jsi::Object& value) {
    auto unistyleHashKeys = getUnistylesHashKeys(rt, value);
    
    // return wrapped RN/inline style
    if (unistyleHashKeys.empty()) {
        return {unistyleFromStaticStyleSheet(rt, value)};
    }

    // last chance to fallback and get unistyle based on hash
    auto unistyles = unistylesFromHashKeys(rt, value, unistyleHashKeys);
    auto areValid = std::all_of(unistyles.begin(), unistyles.end(), [](Unistyle::Shared unistyle){
        return unistyle != nullptr;
    });
    
    if (!areValid) {
        throw jsi::JSError(rt, R"(Unistyles: Style is not bound!

You likely altered unistyle hash key and we're not able to recover C++ state attached to this node.)");
    }

    if (unistyles.size() == 1) {
        return unistyles;
    }

    throw jsi::JSError(rt, R"(Unistyles: Style is not bound!

You likely used the spread operator on a Unistyle style. If you need to merge styles use array syntax:
style={[styles.container, styles.otherProp]})");
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

inline static jsi::Value objectFromUnistyle(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Unistyle::Shared unistyle, Variants& variants, std::optional<jsi::Array> arguments) {
    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);
    auto unistyleID = jsi::PropNameID::forUtf8(rt, unistyle->unid);

    jsi::Object obj = jsi::Object(rt);

    obj.setNativeState(rt, std::move(wrappedUnistyle));
    
    auto secrets = jsi::Object(rt);
    
    if (arguments.has_value()) {
        secrets.setProperty(rt, helpers::ARGUMENTS.c_str(), arguments.value());
    }
    
    obj.setProperty(rt, unistyleID, secrets);

    helpers::mergeJSIObjects(rt, obj, unistyle->parsedStyle.value());

    return obj;
}

inline static jsi::Value valueFromUnistyle(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime, Unistyle::Shared unistyle, Variants& variants) {
    if (unistyle->type == UnistyleType::Object) {
        return objectFromUnistyle(rt, unistylesRuntime, unistyle, variants, std::nullopt);
    }

    auto wrappedUnistyle = std::make_shared<UnistyleWrapper>(unistyle);
    auto unistyleID = jsi::PropNameID::forUtf8(rt, unistyle->unid);

    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);
    auto hostFn = jsi::Value(rt, unistyleFn->proxiedFunction.value()).asObject(rt).asFunction(rt);

    hostFn.setNativeState(rt, std::move(wrappedUnistyle));
    hostFn.setProperty(rt, unistyleID, jsi::Object(rt));

    return std::move(hostFn);
}

}
