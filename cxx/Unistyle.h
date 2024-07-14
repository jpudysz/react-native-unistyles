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
    folly::fbvector<int> nativeTags {};
    folly::fbvector<StyleDependencies> dependencies;

    // for dynamic functions
    std::optional<size_t> count;
    std::optional<folly::dynamic> arguments;

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

    void addDynamicFunctionMetadata(size_t count, folly::dynamic arguments) {
        this->count = count;
        this->arguments = arguments;
    }

    folly::fbvector<StyleDependencies> parseDependencies(jsi::Runtime& rt, const jsi::Object& propertyValue) {
        folly::fbvector<StyleDependencies> parsedDependencies;

        if (!propertyValue.isArray(rt)) {
            // todo throw error

            return parsedDependencies;
        }

        auto deps = propertyValue.asArray(rt);
        size_t length = deps.size(rt);

        for (size_t i = 0; i < length; i++) {
            jsi::Value element = deps.getValueAtIndex(rt, i);
            std::string str = element.asString(rt).utf8(rt);

            parsedDependencies.push_back(unistyles::helpers::getDependencyForString(str));
        }

        return parsedDependencies;
    }

    jsi::Object parseStyle(jsi::Runtime& rt, Variants& variants) {
        auto style = this->rawStyle.asObject(rt);
        auto parsedStyle = jsi::Object(rt);
        
        // we need to be sure that compoundVariants are parsed after variants
        bool shouldParseCompoundVariants = style.hasProperty(rt, "compoundVariants") && style.hasProperty(rt, "variants");

        jsi::Array propertyNames = style.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = style.getProperty(rt, propertyName.c_str());

            // parse dependencies only once
            if (this->dependencies.empty() && propertyName == STYLE_DEPENDENCIES) {
                this->dependencies = this->parseDependencies(rt, propertyValue.asObject(rt));

                continue;
            }

            if (propertyValue.isNumber() || propertyValue.isString()) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

                continue;
            }

            if (propertyValue.isNull() || propertyValue.isUndefined()) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

                continue;
            }

            // ignore non objects at this point
            if (!propertyValue.isObject()) {
                continue;
            }

            auto propertyValueObject = propertyValue.asObject(rt);

            if (propertyValueObject.isFunction(rt)) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValueObject);

                continue;
            }

            if (propertyName == "variants") {
                auto parsedVariant = this->parseVariants(rt, variants, propertyValueObject);
                
                unistyles::helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);
                
                if (shouldParseCompoundVariants) {
                    auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
                    auto parsedCompoundVariants = this->parseCompoundVariants(rt, variants, compoundVariants);
                    
                    unistyles::helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
                }
                
                continue;
            }
            
            // compoundVariants are computed soon after variants
            if (propertyName == "compoundVariants") {
                continue;
            }
     
            if (propertyValueObject.isArray(rt)) {
                // todo check other styles that are arrays as of 0.75
                // 'transform' or 'fontVariant'
                
                continue;
            }
            
            // todo check other styles that are objects as of 0.75
            // 'shadowOffset' or 'textShadowOffset' or 'PlatformColor'
            
            // 'mq' or 'breakpoints'
            auto valueFromBreakpoint = getValueFromBreakpoints(rt, propertyValueObject);
            
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseNestedStyle(rt, valueFromBreakpoint));
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
        
        if (nestedObjectStyle.isArray(rt)) {
            // todo
            
            return jsi::Value::undefined();
        }
        
        // todo here is a new object, parse it
        return jsi::Value::undefined();
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
            
            unistyles::helpers::mergeJSIObjects(rt, parsedVariant, styles);
        }
        
        return parsedVariant;
    }
    
    jsi::Object getStylesForVariant(jsi::Runtime& rt, jsi::Object& groupValue, std::optional<std::string> selectedVariant) {
        auto selectedVariantKey = selectedVariant.has_value()
            ? selectedVariant.value().c_str()
            : "default";
        
        if (groupValue.hasProperty(rt, selectedVariantKey)) {
            return groupValue.getProperty(rt, selectedVariantKey).asObject(rt);
        }
        
        return jsi::Object(rt);
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
                auto styles = valueObject.getPropertyAsObject(rt, "styles");
                
                unistyles::helpers::mergeJSIObjects(rt, parsedCompoundVariants, styles);
            }
        }
        
        return parsedCompoundVariants;
    }
};
