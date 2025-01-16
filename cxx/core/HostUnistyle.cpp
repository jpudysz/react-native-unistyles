#include "HostUnistyle.h"

using namespace margelo::nitro::unistyles::core;
using namespace facebook;

std::vector<jsi::PropNameID> HostUnistyle::getPropertyNames(jsi::Runtime& rt) {
    auto propertyNames = std::vector<jsi::PropNameID> {};

    propertyNames.reserve(8);

    for (const auto& pair : this->_stylesheet->unistyles) {
        propertyNames.emplace_back(jsi::PropNameID::forUtf8(rt, pair.first));
    }

    propertyNames.emplace_back(jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN.c_str()));

    return propertyNames;
}

jsi::Value HostUnistyle::get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) {
    auto propertyName = propNameId.utf8(rt);

    if (propertyName == helpers::STYLESHEET_ID.c_str()) {
        return jsi::Value(this->_stylesheet->tag);
    }

    if (propertyName == helpers::STYLESHEET_VARIANTS.c_str()) {
        return helpers::variantsToValue(rt, this->_variants);
    }

    if (propertyName == helpers::ADD_VARIANTS_FN.c_str()) {
        return this->createAddVariantsProxyFunction(rt);
    }

    if (!this->_stylesheet->unistyles.contains(propertyName)) {
        return jsi::Value::undefined();
    }

    auto& unistyle = this->_stylesheet->unistyles[propertyName];

    // check if Unistyles recomputed new style in the background
    // ()when no node was mounted), if so we need to simply rebuild unistyle to get fresh data
    if (unistyle->isDirty) {
        auto parser = parser::Parser(this->_unistylesRuntime);

        parser.rebuildUnistyle(rt, unistyle, this->_variants, std::nullopt);
    }

    return valueFromUnistyle(rt, this->_unistylesRuntime, this->_stylesheet->unistyles[propertyName], this->_variants);
}

void HostUnistyle::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {}

jsi::Function HostUnistyle::createAddVariantsProxyFunction(jsi::Runtime& rt) {
    auto useVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);
    auto parser = parser::Parser(this->_unistylesRuntime);

    return jsi::Function::createFromHostFunction(rt, useVariantsFnName, 1, [this, &parser](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
        helpers::assertThat(rt, count == 1, "Unistyles: useVariants expected to be called with one argument.");
        helpers::assertThat(rt, arguments[0].isObject(), "Unistyles: useVariants expected to be called with object.");

        Variants variants = helpers::variantsToPairs(rt, arguments[0].asObject(rt));

        helpers::enumerateJSIObject(rt, thisVal.asObject(rt), [this, &parser, &rt, &variants](const std::string& name, jsi::Value& value){
            if (name == helpers::ADD_VARIANTS_FN || !this->_stylesheet->unistyles.contains(name)) {
                return;
            }

            auto unistyle = this->_stylesheet->unistyles[name];

            if (unistyle->dependsOn(UnistyleDependency::VARIANTS)) {
                parser.rebuildUnistyle(rt, unistyle, variants, std::nullopt);
            }
        });

        this->_variants = variants;

        auto style = std::make_shared<core::HostUnistyle>(this->_stylesheet, this->_unistylesRuntime, variants);
        auto styleHostObject = jsi::Object::createFromHostObject(rt, style);

        return styleHostObject;
    });
}
