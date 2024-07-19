#pragma once

#include <folly/dynamic.h>
#include <folly/FBVector.h>
#include <jsi/jsi.h>
#include "UnistylesRuntime.h"
#include "Consts.h"
#include "Helpers.h"
#include "Mq.h"

using namespace facebook;

struct Unistyle {
    std::string name;
    UnistyleType type;
    jsi::Value rawStyle;
    bool hasVariants;
    folly::fbvector<int> nativeTags {};
    folly::fbvector<StyleDependency> dependencies;

    // for dynamic functions
    size_t count;
    folly::fbvector<folly::dynamic> arguments {};

    std::shared_ptr<UnistylesRuntime> unistylesRuntime;

    Unistyle(
        UnistyleType type,
        std::string name,
        jsi::Value rawStyle,
        std::shared_ptr<UnistylesRuntime> unistylesRuntime
    ): name{name}, rawStyle{std::move(rawStyle)}, type{type}, unistylesRuntime{unistylesRuntime} {}

    Unistyle(Unistyle &&src) {
        this->name = std::move(src.name);
        this->type = src.type;
        this->rawStyle = std::move(src.rawStyle);
        this->nativeTags = std::move(src.nativeTags);
        this->dependencies = std::move(src.dependencies);
        this->unistylesRuntime = src.unistylesRuntime;
    }

    void addDynamicFunctionMetadata(jsi::Runtime& rt, size_t count, const jsi::Value* arguments) {
        this->count = count;
        
        for (size_t i = 0; i < count; i++) {
            auto& arg = arguments[i];
            
            if (arg.isBool()) {
                this->arguments.push_back(folly::dynamic(arg.asBool()));
                
                continue;
            }
            
            if (arg.isNumber()) {
                this->arguments.push_back(folly::dynamic(arg.asNumber()));
                
                continue;
            }
            
            if (arg.isString()) {
                this->arguments.push_back(folly::dynamic(arg.asString(rt).utf8(rt)));
                
                continue;
            }
            
            if (arg.isUndefined()) {
                this->arguments.push_back(folly::dynamic());
                
                continue;
            }
            
            if (arg.isNull()) {
                this->arguments.push_back(folly::dynamic(nullptr));
                
                continue;
            }
            
            if (arg.isObject()) {
                this->arguments.push_back(jsi::dynamicFromValue(rt, arg));
                
                continue;
            }
        }
    }

    folly::fbvector<StyleDependency> parseDependencies(jsi::Runtime& rt, const jsi::Object& propertyValue) {
        folly::fbvector<StyleDependency> parsedDependencies;

        if (!propertyValue.isArray(rt)) {
            // todo throw error

            return parsedDependencies;
        }

        auto deps = propertyValue.asArray(rt);
        size_t length = deps.size(rt);

        for (size_t i = 0; i < length; i++) {
            jsi::Value element = deps.getValueAtIndex(rt, i);
            StyleDependency dependency = static_cast<StyleDependency>(element.asNumber());

            parsedDependencies.push_back(dependency);
        }

        return parsedDependencies;
    }

    jsi::Object parseStyle(jsi::Runtime& rt, Variants& variants) {
        auto style = this->rawStyle.asObject(rt);
        auto parsedStyle = jsi::Object(rt);

        // we need to be sure that compoundVariants are parsed after variants after every other style
        bool shouldParseVariants = style.hasProperty(rt, "variants");
        bool shouldParseCompoundVariants = style.hasProperty(rt, "compoundVariants") && shouldParseVariants;

        jsi::Array propertyNames = style.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = style.getProperty(rt, propertyName.c_str());

            // parse dependencies only once
            if (propertyName == STYLE_DEPENDENCIES && this->dependencies.empty()) {
                this->dependencies = this->parseDependencies(rt, propertyValue.asObject(rt));
                this->hasVariants = std::find(this->dependencies.cbegin(), this->dependencies.cend(), StyleDependency::Variants) != this->dependencies.end();

                continue;
            }
            
            if (propertyName == STYLE_DEPENDENCIES && !this->dependencies.empty()) {
                continue;
            }

            // for primitives do nothing
            if (propertyValue.isNumber() || propertyValue.isString() || propertyValue.isUndefined() || propertyValue.isNull()) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

                continue;
            }

            // ignore non objects
            if (!propertyValue.isObject()) {
                continue;
            }

            auto propertyValueObject = propertyValue.asObject(rt);

            // ignore any functions as values
            if (propertyValueObject.isFunction(rt)) {
                continue;
            }

            // variants are computed soon after all styles
            if (propertyName == "variants") {
                continue;
            }

            // compoundVariants are computed soon after variants
            if (propertyName == "compoundVariants") {
                continue;
            }

            if (propertyName == "transform" && propertyValueObject.isArray(rt)) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseTransforms(rt, propertyValueObject));

                continue;
            }

            if (propertyName == "fontVariant" && propertyValueObject.isArray(rt)) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

                continue;
            }

            if (propertyName == "shadowOffset" || propertyName == "textShadowOffset") {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseNestedStyle(rt, propertyValue));

                continue;
            }

            if (unistyles::helpers::isPlatformColor(rt, propertyValueObject)) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValueObject);

                continue;
            }

            // 'mq' or 'breakpoints'
            auto valueFromBreakpoint = getValueFromBreakpoints(rt, propertyValueObject);

            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseNestedStyle(rt, valueFromBreakpoint));
        }
        
        if (shouldParseVariants && !variants.empty()) {
            auto propertyValueObject = style.getProperty(rt, "variants").asObject(rt);
            auto parsedVariant = this->parseVariants(rt, variants, propertyValueObject);
            
            unistyles::helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);

            if (shouldParseCompoundVariants) {
                auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
                auto parsedCompoundVariants = this->parseCompoundVariants(rt, variants, compoundVariants);

                unistyles::helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
            }
        }

        return parsedStyle;
    }

    jsi::Value parseNestedStyle(jsi::Runtime& rt, jsi::Value& nestedStyle) {
        if (nestedStyle.isString() || nestedStyle.isNumber() || nestedStyle.isUndefined() || nestedStyle.isNull()) {
            return jsi::Value(rt, nestedStyle);
        }

        if (!nestedStyle.isObject()) {
            return jsi::Value::undefined();
        }

        auto nestedObjectStyle = nestedStyle.asObject(rt);

        if (nestedObjectStyle.isArray(rt) || nestedObjectStyle.isFunction(rt)) {
            return jsi::Value::undefined();
        }

        jsi::Object parsedStyle = jsi::Object(rt);

        jsi::Array propertyNames = nestedObjectStyle.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = nestedObjectStyle.getProperty(rt, propertyName.c_str());
   
            if (propertyValue.isString() || propertyValue.isNumber() || propertyValue.isUndefined() || propertyValue.isNull()) {
                parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);

                continue;
            }

            if (!propertyValue.isObject()) {
                parsedStyle.setProperty(rt, propertyName.c_str(), jsi::Value::undefined());

                continue;
            }

            auto nestedObjectStyle = propertyValue.asObject(rt);

            if (nestedObjectStyle.isFunction(rt)) {
                parsedStyle.setProperty(rt, propertyName.c_str(), jsi::Value::undefined());

                continue;
            }
            
            // possible with variants and compoundVariants
            if (nestedObjectStyle.isArray(rt) && propertyName == "transform") {
                parsedStyle.setProperty(rt, propertyName.c_str(), parseTransforms(rt, nestedObjectStyle));
                
                continue;
            }
            
            if (nestedObjectStyle.isArray(rt) && propertyName == "fontVariant") {
                parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);
                
                continue;
            }

            parsedStyle.setProperty(rt, propertyName.c_str(), getValueFromBreakpoints(rt, nestedObjectStyle));
        }

        return parsedStyle;
    }

    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj) {
        auto hasBreakpoints = !this->unistylesRuntime->sortedBreakpointPairs.empty();
        auto currentBreakpoint = this->unistylesRuntime->breakpoint;
        auto currentOrientation = this->unistylesRuntime->screen.width > this->unistylesRuntime->screen.height
            ? "landscape"
            : "portrait";

        jsi::Array propertyNames = obj.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        // mq has the biggest priority, so check if first
        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = obj.getProperty(rt, propertyName.c_str());

            if (unistyles::mq::getFrom(propertyName, unistylesRuntime->screen)) {
                // todo handle transforms etc.
                return propertyValue;
            }
        }

        // handle default breakpoints
        if (!hasBreakpoints && obj.hasProperty(rt, currentOrientation)) {
            return obj.getProperty(rt, currentOrientation);
        }

        if (currentBreakpoint == "") {
            return jsi::Value::undefined();
        }

        // if you're still here it means that there is no
        // matching mq nor default breakpoint, let's find the user defined breakpoint
        auto currentBreakpointIt = std::find_if(
            this->unistylesRuntime->sortedBreakpointPairs.rbegin(),
            this->unistylesRuntime->sortedBreakpointPairs.rend(),
            [&currentBreakpoint](std::pair<std::string, double>& breakpoint){
                return breakpoint.first == currentBreakpoint;
            }
        );

        for (auto it = currentBreakpointIt; it != this->unistylesRuntime->sortedBreakpointPairs.rend(); ++it) {
            auto breakpoint = it->first.c_str();

            if (obj.hasProperty(rt, breakpoint)) {
                return obj.getProperty(rt, breakpoint);
            }
        }

        return jsi::Value::undefined();
    }

    jsi::Object parseVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& obj) {
        jsi::Object parsedVariant = jsi::Object(rt);

        jsi::Array propertyNames = obj.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        for (size_t i = 0; i < length; i++) {
            auto groupName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto groupValue = obj.getProperty(rt, groupName.c_str()).asObject(rt);

            auto it = std::find_if(
                variants.cbegin(),
                variants.cend(),
                [&groupName](auto& variant){
                    return variant.first == groupName;
                }
            );

            auto selectedVariant = it != variants.end()
                ? std::make_optional(it->second)
                : std::nullopt;

            auto styles = this->getStylesForVariant(rt, groupValue, selectedVariant);
            
            if (styles.isUndefined() || !styles.isObject()) {
                continue;
            }
            
            auto parsedNestedStyles = parseNestedStyle(rt, styles).asObject(rt);

            unistyles::helpers::mergeJSIObjects(rt, parsedVariant, parsedNestedStyles);
        }

        return parsedVariant;
    }

    jsi::Value getStylesForVariant(jsi::Runtime& rt, jsi::Object& groupValue, std::optional<std::string> selectedVariant) {
        auto selectedVariantKey = selectedVariant.has_value()
            ? selectedVariant.value().c_str()
            : "default";

        if (groupValue.hasProperty(rt, selectedVariantKey)) {
            return groupValue.getProperty(rt, selectedVariantKey);
        }

        return jsi::Value::undefined();
    }

    jsi::Object parseCompoundVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& obj) {
        if (!obj.isArray(rt)) {
            return jsi::Object(rt);
        }

        auto array = obj.asArray(rt);
        jsi::Object parsedCompoundVariants = jsi::Object(rt);
        size_t length = array.length(rt);

        for (size_t i = 0; i < length; i++) {
            jsi::Value value = array.getValueAtIndex(rt, i);

            if (!value.isObject()) {
                continue;
            }

            auto valueObject = value.asObject(rt);

            if (unistyles::helpers::containsAllPairs(rt, variants, valueObject)) {
                auto styles = valueObject.getProperty(rt, "styles");
                auto parsedNestedStyles = parseNestedStyle(rt, styles).asObject(rt);
                
                unistyles::helpers::mergeJSIObjects(rt, parsedCompoundVariants, parsedNestedStyles);
            }
        }

        return parsedCompoundVariants;
    }

    jsi::Value parseTransforms(jsi::Runtime& rt, jsi::Object& obj) {
        if (!obj.isArray(rt)) {
            return jsi::Value::undefined();
        }

        jsi::Array transforms = obj.asArray(rt);
        jsi::Array parsedTransforms = jsi::Array(rt, transforms.length(rt));

        size_t length = transforms.length(rt);

        for (size_t i = 0; i < length; i++) {
            jsi::Value value = transforms.getValueAtIndex(rt, i);

            if (!value.isObject()) {
                parsedTransforms.setValueAtIndex(rt, i, jsi::Value::undefined());
                continue;
            }

            parsedTransforms.setValueAtIndex(rt, i, parseNestedStyle(rt, value));
        }

        return parsedTransforms;
    }
};
