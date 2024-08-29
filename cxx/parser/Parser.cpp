#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

jsi::Object parser::Parser::parseUnistyles(jsi::Runtime &rt, std::vector<core::Unistyle>& unistyles, ParserSettings& settings) {
    jsi::Object reactNativeStyles = jsi::Object(rt);

    for (core::Unistyle& unistyle : unistyles) {
        if (unistyle.type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle, settings);

            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(result));
        }

        if (unistyle.type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle, settings);

            helpers::defineHiddenProperty(rt, reactNativeStyles, helpers::PROXY_FN_PREFIX + unistyle.styleKey, unistyle.rawValue.asFunction(rt));
            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(hostFn));
        }
    }

    return reactNativeStyles;
}

jsi::Function parser::Parser::createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle, ParserSettings& settings) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forUtf8(rt, unistyle.styleKey),
        1,
        [&](jsi::Runtime& rt, const jsi::Value& thisValue, const jsi::Value* args, size_t count) {
            // call original function
            auto result = thisValue
                .asObject(rt)
                .getProperty(rt, jsi::String::createFromUtf8(rt, helpers::PROXY_FN_PREFIX + unistyle.styleKey))
                .asObject(rt)
                .asFunction(rt)
                .call(rt, args, count);

            // save function metadata if not present
            if (!unistyle.dynamicFunctionMetadata.has_value()) {
                unistyle.dynamicFunctionMetadata = std::make_pair(count, this->parseDynamicFunctionArguments(rt, count, args));
            }

            return this->parseFirstLevel(rt, unistyle, settings);
    });
}

std::vector<folly::dynamic> parser::Parser::parseDynamicFunctionArguments(jsi::Runtime& rt, size_t count, const jsi::Value* arguments) {
    std::vector<folly::dynamic> parsedArgument{};

    for (size_t i = 0; i < count; i++) {
        auto& arg = arguments[i];

        if (arg.isBool()) {
            parsedArgument.push_back(folly::dynamic(arg.asBool()));

            continue;
        }

        if (arg.isNumber()) {
            parsedArgument.push_back(folly::dynamic(arg.asNumber()));

            continue;
        }

        if (arg.isString()) {
            parsedArgument.push_back(folly::dynamic(arg.asString(rt).utf8(rt)));

            continue;
        }

        if (arg.isUndefined()) {
            parsedArgument.push_back(folly::dynamic());

            continue;
        }

        if (arg.isNull()) {
            parsedArgument.push_back(folly::dynamic(nullptr));

            continue;
        }

        if (arg.isObject()) {
            parsedArgument.push_back(jsi::dynamicFromValue(rt, arg));

            continue;
        }
    }

    return parsedArgument;
}

std::vector<core::UnistyleDependency> parser::Parser::parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies) {
    helpers::assertThat(rt, dependencies.isArray(rt), "babel transform is invalid. Unexpected type for dependencies. Please report new Github issue.");
    
    std::vector<core::UnistyleDependency> parsedDependencies;

    auto deps = dependencies.asArray(rt);
    size_t length = deps.size(rt);

    for (size_t i = 0; i < length; i++) {
        jsi::Value element = deps.getValueAtIndex(rt, i);
        auto dependency = static_cast<core::UnistyleDependency>(element.asNumber());

        parsedDependencies.push_back(dependency);
    }

    return parsedDependencies;
}

jsi::Value parser::Parser::parseTransforms(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings) {
    if (!obj.isArray(rt)) {
        return jsi::Value::undefined();
    }
    
    std::vector<jsi::Value> parsedTransforms{};
    jsi::Array transforms = obj.asArray(rt);
    size_t length = transforms.length(rt);

    for (size_t i = 0; i < length; i++) {
        jsi::Value value = transforms.getValueAtIndex(rt, i);

        if (!value.isObject()) {
            parsedTransforms.push_back(jsi::Value::undefined());
            
            continue;
        }
        
        auto parsedResult = this->parseSecondLevel(rt, value, settings);

        helpers::enumerateJSIObject(rt, parsedResult.asObject(rt), [&](const std::string& propertyName, jsi::Value& propertyValue){
            // we shouldn't allow undefined in transforms, simply remove entire object from array
            if (!propertyValue.isUndefined()) {
                parsedTransforms.emplace_back(&parsedResult);
            }
        });
    }
    
    jsi::Array result = jsi::Array(rt, parsedTransforms.size());
    
    for (size_t i = 0; i < parsedTransforms.size(); i++) {
        result.setValueAtIndex(rt, i, parsedTransforms[i]);
    }

    return result;
}

jsi::Value parser::Parser::getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings) {
    auto hasBreakpoints = !settings.sortedBreakpointPairs.empty();
    auto currentBreakpoint = settings.currentBreakpointName;
    auto currentOrientation = settings.screenDimensions.width > settings.screenDimensions.height
        ? "landscape"
        : "portrait";

    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);
    
    // mq has the biggest priority, so check if first
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());
        auto mq = core::UnistylesMQ{propertyName};
        
        if (mq.isWithinTheWidthAndHeight(settings.screenDimensions)) {
            // todo handle transforms etc.
            return propertyValue;
        }
    }

    // handle orientation breakpoints
    if (!hasBreakpoints && obj.hasProperty(rt, currentOrientation)) {
        return obj.getProperty(rt, currentOrientation);
    }

    if (!currentBreakpoint.has_value()) {
        return jsi::Value::undefined();
    }

    // if you're still here it means that there is no
    // matching mq nor default breakpoint, let's find the user defined breakpoint
    auto currentBreakpointIt = std::find_if(
        settings.sortedBreakpointPairs.rbegin(),
        settings.sortedBreakpointPairs.rend(),
        [&currentBreakpoint](const std::pair<std::string, double>& breakpoint){
            return breakpoint.first == currentBreakpoint.value();
        }
    );

    // look for any hit in reversed vector
    for (auto it = currentBreakpointIt; it != settings.sortedBreakpointPairs.rend(); ++it) {
        auto breakpoint = it->first.c_str();

        if (obj.hasProperty(rt, breakpoint)) {
            return obj.getProperty(rt, breakpoint);
        }
    }

    return jsi::Value::undefined();
}

jsi::Object parser::Parser::parseVariants(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings) {
    jsi::Object parsedVariant = jsi::Object(rt);
    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    for (size_t i = 0; i < length; i++) {
        auto groupName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto groupValue = obj.getProperty(rt, groupName.c_str()).asObject(rt);

        auto it = std::find_if(
            settings.variants.cbegin(),
            settings.variants.cend(),
            [&groupName](auto& variant){
                return variant.first == groupName;
            }
        );

        auto selectedVariant = it != settings.variants.end()
            ? std::make_optional(it->second)
            : std::nullopt;

        auto styles = this->getStylesForVariant(rt, groupValue, selectedVariant);
        
        if (styles.isUndefined() || !styles.isObject()) {
            continue;
        }
        
        auto parsedNestedStyles = this->parseSecondLevel(rt, styles, settings).asObject(rt);

        helpers::mergeJSIObjects(rt, parsedVariant, parsedNestedStyles);
    }

    return parsedVariant;
}

jsi::Value parser::Parser::getStylesForVariant(jsi::Runtime& rt, jsi::Object& groupValue, std::optional<std::string> selectedVariant) {
    auto selectedVariantKey = selectedVariant.has_value()
        ? selectedVariant.value().c_str()
        : "default";

    if (groupValue.hasProperty(rt, selectedVariantKey)) {
        return groupValue.getProperty(rt, selectedVariantKey);
    }

    return jsi::Value::undefined();
}

jsi::Object parser::Parser::parseCompoundVariants(jsi::Runtime& rt, jsi::Object& obj, ParserSettings& settings) {
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

        if (this->shouldApplyCompoundVariants(rt, settings.variants, valueObject)) {
            auto styles = valueObject.getProperty(rt, "styles");
            auto parsedNestedStyles = this->parseSecondLevel(rt, styles, settings).asObject(rt);
            
            unistyles::helpers::mergeJSIObjects(rt, parsedCompoundVariants, parsedNestedStyles);
        }
    }

    return parsedCompoundVariants;
}

bool parser::Parser::shouldApplyCompoundVariants(jsi::Runtime& rt, const Variants& variants, jsi::Object& compoundVariant) {
    if (variants.empty()) {
        return false;
    }

    jsi::Array propertyNames = compoundVariant.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);
    size_t allConditions = compoundVariant.hasProperty(rt, "styles")
        ? length - 1
        : length;

    if (allConditions != variants.size()) {
        return false;
    }

    for (auto it = variants.cbegin(); it != variants.cend(); ++it) {
        auto variantKey = it->first;
        auto variantValue = it->second;

        if (!compoundVariant.hasProperty(rt, variantKey.c_str())) {
            return false;
        }

        auto property = compoundVariant.getProperty(rt, variantKey.c_str());
        auto propertyName = property.isBool()
            ? (property.asBool() ? "true" : "false")
            : property.asString(rt).utf8(rt);

        if (propertyName != variantValue) {
            return false;
        }
    }

    return true;
}

jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle, ParserSettings& settings) {
    auto& style = unistyle.rawValue;
    auto parsedStyle = jsi::Object(rt);

    // we need to be sure that compoundVariants are parsed after variants and after every other style
    bool shouldParseVariants = style.hasProperty(rt, "variants");
    bool shouldParseCompoundVariants = style.hasProperty(rt, "compoundVariants") && shouldParseVariants;

    helpers::enumerateJSIObject(rt, style, [&](const std::string& propertyName, jsi::Value& propertyValue){
        // parse dependencies only once
        if (propertyName == helpers::STYLE_DEPENDENCIES && unistyle.dependencies.empty()) {
            unistyle.dependencies = this->parseDependencies(rt, propertyValue.asObject(rt));

            return;
        }
        
        if (propertyName == helpers::STYLE_DEPENDENCIES && !unistyle.dependencies.empty()) {
            return;
        }
        
        // primitives
        if (propertyValue.isNumber() || propertyValue.isString() || propertyValue.isUndefined() || propertyValue.isNull()) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

            return;
        }
        
        // at this point ignore non objects
        if (!propertyValue.isObject()) {
            return;
        }
        
        auto propertyValueObject = propertyValue.asObject(rt);
        
        // ignore any functions at this level
        if (propertyValueObject.isFunction(rt)) {
            return;
        }
        
        // variants and compoundVariants are computed soon after all styles
        if (propertyName == "variants" || propertyName == "compoundVariants") {
            return;
        }

        if (propertyName == "transform" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseTransforms(rt, propertyValueObject, settings));

            return;
        }
        
        if (propertyName == "fontVariant" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

            return;
        }

        if (propertyName == "shadowOffset" || propertyName == "textShadowOffset") {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), this->parseSecondLevel(rt, propertyValue, settings));

            return;
        }

        if (helpers::isPlatformColor(rt, propertyValueObject)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValueObject);

            return;
        }
        
        // 'mq' or 'breakpoints'
        auto valueFromBreakpoint = getValueFromBreakpoints(rt, propertyValueObject, settings);

        parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), this->parseSecondLevel(rt, valueFromBreakpoint, settings));
    });

    if (shouldParseVariants && !settings.variants.empty()) {
        auto propertyValueObject = style.getProperty(rt, "variants").asObject(rt);
        auto parsedVariant = this->parseVariants(rt, propertyValueObject, settings);
        
        helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);

        if (shouldParseCompoundVariants) {
            auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
            auto parsedCompoundVariants = this->parseCompoundVariants(rt, compoundVariants, settings);

            helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
        }
    }
    
    return parsedStyle;
}

jsi::Value parser::Parser::parseSecondLevel(jsi::Runtime &rt, jsi::Value& nestedStyle, ParserSettings& settings) {
    // primitives
    if (nestedStyle.isString() || nestedStyle.isNumber() || nestedStyle.isUndefined() || nestedStyle.isNull()) {
        return jsi::Value(rt, nestedStyle);
    }

    // ignore any non objects at this level
    if (!nestedStyle.isObject()) {
        return jsi::Value::undefined();
    }

    auto nestedObjectStyle = nestedStyle.asObject(rt);

    // too deep to accept any functions or arrays
    if (nestedObjectStyle.isArray(rt) || nestedObjectStyle.isFunction(rt)) {
        return jsi::Value::undefined();
    }
    
    jsi::Object parsedStyle = jsi::Object(rt);
    
    helpers::enumerateJSIObject(rt, nestedObjectStyle, [&](const std::string& propertyName, jsi::Value& propertyValue){
        // primitives
        if (propertyValue.isString() || propertyValue.isNumber() || propertyValue.isUndefined() || propertyValue.isNull()) {
            parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);

            return;
        }

        // ignore any non objects at this level
        if (!propertyValue.isObject()) {
            parsedStyle.setProperty(rt, propertyName.c_str(), jsi::Value::undefined());

            return;
        }

        auto nestedObjectStyle = propertyValue.asObject(rt);

        if (nestedObjectStyle.isFunction(rt)) {
            parsedStyle.setProperty(rt, propertyName.c_str(), jsi::Value::undefined());

            return;
        }
        
        // possible with variants and compoundVariants
        if (nestedObjectStyle.isArray(rt) && propertyName == "transform") {
            parsedStyle.setProperty(rt, propertyName.c_str(), parseTransforms(rt, nestedObjectStyle, settings));
            
            return;
        }
        
        if (nestedObjectStyle.isArray(rt) && propertyName == "fontVariant") {
            parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);
            
            return;
        }

        parsedStyle.setProperty(rt, propertyName.c_str(), this->getValueFromBreakpoints(rt, nestedObjectStyle, settings));
    });

    return parsedStyle;
}
