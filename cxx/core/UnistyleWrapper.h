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

inline static std::string generateStyleKey(std::string& key, int tag) {
    return std::string("__unid_").append(std::to_string(tag)).append("_").append(key).c_str();
}

inline static Unistyle::Shared unistyleFromKey(jsi::Runtime& rt, const std::string& key) {
    std::string prefix = "__unid_";

    if (key.substr(0, prefix.length()) != prefix) {
        return nullptr;
    }

    std::string remaining = key.substr(prefix.length());

    size_t underscorePos = remaining.find('_');

    if (underscorePos == std::string::npos) {
        return nullptr;
    }

    std::string tagStr = remaining.substr(0, underscorePos);

    auto& registry = UnistylesRegistry::get();
    auto tag = std::stoi(tagStr);
    auto styleKey = remaining.substr(underscorePos + 1);

    return registry.findUnistyleFromKey(rt, styleKey, tag);
}

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
    std::vector<Unistyle::Shared> foundUnistyles{};

    helpers::enumerateJSIObject(rt, value, [&](const std::string& key, jsi::Value& value){
        auto maybeUnistyle = unistyleFromKey(rt, key);

        if (maybeUnistyle != nullptr) {
            foundUnistyles.emplace_back(maybeUnistyle);
        }
    });

    if (foundUnistyles.size() == 0) {
        return {unistyleFromStaticStyleSheet(rt, value)};
    }

    return foundUnistyles;
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
        obj.setProperty(rt, std::string("__unid_").append(std::to_string(tag)).append("_").append(unistyle->styleKey).c_str(), jsi::Value::undefined());
        
        helpers::mergeJSIObjects(rt, obj, unistyle->parsedStyle.value());

        return obj;
    }

    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);
    auto hostFn = jsi::Value(rt, unistyleFn->proxiedFunction.value()).asObject(rt).asFunction(rt);

    hostFn.setNativeState(rt, std::move(wrappedUnistyle));
    hostFn.setProperty(rt, std::string("__unid_").append(std::to_string(tag)).append("_").append(unistyleFn->styleKey).c_str(), jsi::Value::undefined());
    
    return std::move(hostFn);
}

}
