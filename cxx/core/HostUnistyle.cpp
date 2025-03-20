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
    // (when no node was mounted), if so we need to simply rebuild unistyle to get fresh data
    if (unistyle->isDirty) {
        this->_cache.erase(propertyName);

        auto parser = parser::Parser(this->_unistylesRuntime);

        parser.rebuildUnistyle(rt, unistyle, this->_variants, std::nullopt);
    }

    if (unistyle->type == UnistyleType::DynamicFunction) {
        // for dynamic functions we will also bind "this"
        auto styleFn = valueFromUnistyle(rt, this->_unistylesRuntime, unistyle, this->_variants);

        // construct newThis
        jsi::Object newThis = jsi::Object(rt);
        newThis.setProperty(rt, helpers::STYLESHEET_VARIANTS.c_str(), helpers::variantsToValue(rt, this->_variants));

        auto functionPrototype = rt.global()
            .getPropertyAsObject(rt, "Function")
            .getPropertyAsObject(rt, "prototype")
            .getPropertyAsFunction(rt, "bind");

        return functionPrototype.callWithThis(rt, styleFn.asObject(rt), newThis);
    }

    if (this->_cache.contains(propertyName)) {
        return jsi::Value(rt, this->_cache[propertyName]);
    }

    auto style = valueFromUnistyle(rt, this->_unistylesRuntime, unistyle, this->_variants);

    this->_cache.emplace(propertyName, jsi::Value(rt, style));

    return style;
}

void HostUnistyle::set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) {}

jsi::Function HostUnistyle::createAddVariantsProxyFunction(jsi::Runtime& rt) {
    auto useVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);

    return jsi::Function::createFromHostFunction(rt, useVariantsFnName, 1, [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
        helpers::assertThat(rt, count == 1, "Unistyles: useVariants expected to be called with one argument.");
        helpers::assertThat(rt, arguments[0].isObject(), "Unistyles: useVariants expected to be called with object.");

        Variants variants = helpers::variantsToPairs(rt, arguments[0].asObject(rt));
        parser::Parser parser = parser::Parser(this->_unistylesRuntime);

        auto stylesheetCopy = std::make_shared<StyleSheet>(
            this->_stylesheet->tag,
            this->_stylesheet->type,
            jsi::Value(rt, this->_stylesheet->rawValue).asObject(rt)
        );
        
        parser.buildUnistyles(rt, stylesheetCopy);
        parser.parseUnistyles(rt, stylesheetCopy);
        
        helpers::enumerateJSIObject(rt, thisVal.asObject(rt), [this, &parser, &rt, &variants, stylesheetCopy](const std::string& name, jsi::Value& value){
            if (name == helpers::ADD_VARIANTS_FN || !stylesheetCopy->unistyles.contains(name)) {
                return;
            }

            auto unistyle = stylesheetCopy->unistyles[name];
            
            if (unistyle->dependsOn(UnistyleDependency::VARIANTS)) {
                parser.rebuildUnistyle(rt, unistyle, variants, std::nullopt);
            }
        });

        auto style = std::make_shared<core::HostUnistyle>(stylesheetCopy, this->_unistylesRuntime, variants);
        auto styleHostObject = jsi::Object::createFromHostObject(rt, style);

        return styleHostObject;
    });
}
