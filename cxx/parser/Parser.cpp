#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

using Variants = std::vector<std::pair<std::string, std::string>>;

void parser::Parser::buildUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    jsi::Object unwrappedStyleSheet = this->unwrapStyleSheet(rt, styleSheet);
    
    helpers::enumerateJSIObject(rt, unwrappedStyleSheet, [&](const std::string& styleKey, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "style with name '" + styleKey + "' is not a function or object.");
        
        jsi::Object styleValue = propertyValue.asObject(rt);
        
        if (styleValue.isFunction(rt)) {
            styleSheet->unistyles.emplace_back(std::make_shared<Unistyle>(UnistyleType::DynamicFunction, styleKey, styleValue));
            
            return;
        }

        styleSheet->unistyles.emplace_back(std::make_shared<Unistyle>(UnistyleType::Object, styleKey, styleValue));
    });
}

jsi::Object parser::Parser::unwrapStyleSheet(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    // firstly we need to get object representation of user's StyleSheet
    // StyleSheet can be a function or an object

    // StyleSheet is already an object
    if (styleSheet->type == StyleSheetType::Static) {
        return jsi::Value(rt, styleSheet->rawValue).asObject(rt);
    }

    // StyleSheet is a function
    auto& state = core::UnistylesRegistry::get().getState(rt);
    auto theme = state.getJSTheme();

    if (styleSheet->type == StyleSheetType::Themable) {
        return styleSheet->rawValue
            .asFunction(rt)
            .call(rt, std::move(theme))
            .asObject(rt);
    }

    // stylesheet also has a mini runtime dependency
    // StyleSheetType::ThemableWithMiniRuntime
    auto miniRuntime = this->_unistylesRuntime->getMiniRuntimeAsValue(rt);

    return styleSheet->rawValue
        .asFunction(rt)
        .call(rt, std::move(theme), std::move(miniRuntime))
        .asObject(rt);
}

void parser::Parser::parseUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    for (Unistyle::Shared unistyle : styleSheet->unistyles) {
        if (unistyle->type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle, styleSheet->variants);

            unistyle->parsedStyle = std::move(result);
        }

        if (unistyle->type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle, styleSheet->variants);

            helpers::defineHiddenProperty(rt, *unistyle->parsedStyle, helpers::PROXY_FN_PREFIX + unistyle->styleKey, unistyle->rawValue.asFunction(rt));
            unistyle->parsedStyle->setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle->styleKey), std::move(hostFn));
        }
    }
}

void parser::Parser::rebuildUnistylesWithVariants(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    for (Unistyle::Shared unistyle : styleSheet->unistyles) {
        if (!unistyle->dependsOn(UnistyleDependency::VARIANTS)) {
            continue;
        }
        
        if (unistyle->type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle, styleSheet->variants);

            unistyle->parsedStyle = std::move(result);
        }

        if (unistyle->type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle, styleSheet->variants);

            helpers::defineHiddenProperty(rt, *unistyle->parsedStyle, helpers::PROXY_FN_PREFIX + unistyle->styleKey, unistyle->rawValue.asFunction(rt));
            unistyle->parsedStyle->setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle->styleKey), std::move(hostFn));
        }
    }
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

        if (!arg.isObject()) {
            continue;;
        }

        auto argObj = arg.asObject(rt);

        // allow arrays and objects too
        if (!argObj.isFunction(rt) && !argObj.isArrayBuffer(rt)) {
            parsedArgument.push_back(jsi::dynamicFromValue(rt, arg));

            continue;
        }
    }

    return parsedArgument;
}

jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime& rt, Unistyle::Shared unistyle, Variants& variants) {
    // for objects - we simply operate on them
    // for functions we need to work on the saved result (object)
    auto& style = unistyle->type == core::UnistyleType::Object
        ? unistyle->rawValue
        : unistyle->parsedStyle.value();
    auto parsedStyle = jsi::Object(rt);

    // we need to be sure that compoundVariants are parsed after variants and after every other style
    bool shouldParseVariants = style.hasProperty(rt, "variants");
    bool shouldParseCompoundVariants = style.hasProperty(rt, "compoundVariants") && shouldParseVariants;

    helpers::enumerateJSIObject(rt, style, [&](const std::string& propertyName, jsi::Value& propertyValue){
        // parse dependencies only once
        if (propertyName == helpers::STYLE_DEPENDENCIES && unistyle->dependencies.empty()) {
            unistyle->dependencies = this->parseDependencies(rt, propertyValue.asObject(rt));

            return;
        }

        if (propertyName == helpers::STYLE_DEPENDENCIES && !unistyle->dependencies.empty()) {
            return;
        }
        
        if (propertyName == helpers::WEB_STYLE_KEY) {
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

        // also, ignore any functions at this level
        if (propertyValueObject.isFunction(rt)) {
            return;
        }

        // variants and compoundVariants are computed soon after all styles
        if (propertyName == "variants" || propertyName == "compoundVariants") {
            return;
        }

        if (propertyName == "transform" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseTransforms(rt, propertyValueObject));

            return;
        }

        if (propertyName == "fontVariant" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

            return;
        }

        if (propertyName == "shadowOffset" || propertyName == "textShadowOffset") {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), this->parseSecondLevel(rt, propertyValue));

            return;
        }

        if (helpers::isPlatformColor(rt, propertyValueObject)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValueObject);

            return;
        }

        // 'mq' or 'breakpoints'
        auto valueFromBreakpoint = getValueFromBreakpoints(rt, propertyValueObject);

        parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), this->parseSecondLevel(rt, valueFromBreakpoint));
    });

    if (shouldParseVariants && !variants.empty()) {
        auto propertyValueObject = style.getProperty(rt, "variants").asObject(rt);
        auto parsedVariant = this->parseVariants(rt, propertyValueObject, variants);

        helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);

        if (shouldParseCompoundVariants) {
            auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
            auto parsedCompoundVariants = this->parseCompoundVariants(rt, compoundVariants, variants);

            helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
        }
    }

    return parsedStyle;
}

jsi::Function parser::Parser::createDynamicFunctionProxy(jsi::Runtime& rt, Unistyle::Shared unistyle, Variants& variants) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forUtf8(rt, unistyle->styleKey),
        1,
        [&](jsi::Runtime& rt, const jsi::Value& thisValue, const jsi::Value* args, size_t count) {
            // call original function
            auto result = thisValue
                .asObject(rt)
                .getProperty(rt, jsi::String::createFromUtf8(rt, helpers::PROXY_FN_PREFIX + unistyle->styleKey))
                .asObject(rt)
                .asFunction(rt)
                .call(rt, args, count);

            // save function metadata to call it later
            unistyle->dynamicFunctionMetadata = core::DynamicFunctionMetadata{
                count,
                this->parseDynamicFunctionArguments(rt, count, args)
            };

            unistyle->parsedStyle = jsi::Value(rt, result).asObject(rt);

            return this->parseFirstLevel(rt, unistyle, variants);
    });
}

std::vector<UnistyleDependency> parser::Parser::parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies) {
    helpers::assertThat(rt, dependencies.isArray(rt), "babel transform is invalid. Unexpected type for dependencies. Please report new Github issue.");

    std::vector<UnistyleDependency> parsedDependencies;

    helpers::iterateJSIArray(rt, dependencies.asArray(rt), [&](size_t i, jsi::Value& value){
        auto dependency = static_cast<UnistyleDependency>(value.asNumber());

        parsedDependencies.push_back(dependency);
    });

    return parsedDependencies;
}

jsi::Value parser::Parser::parseTransforms(jsi::Runtime& rt, jsi::Object& obj) {
    // eg. [{ scale: 2 }, { translateX: 100 }]

    if (!obj.isArray(rt)) {
        return jsi::Value::undefined();
    }

    std::vector<jsi::Value> parsedTransforms{};

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto parsedResult = this->parseSecondLevel(rt, value);

        helpers::enumerateJSIObject(rt, parsedResult.asObject(rt), [&](const std::string& propertyName, jsi::Value& propertyValue){
            // we shouldn't allow undefined in transforms, simply remove entire object from array
            if (!propertyValue.isUndefined()) {
                parsedTransforms.emplace_back(std::move(parsedResult));
            }
        });
    });

    // create jsi::Array result with correct transforms
    jsi::Array result = jsi::Array(rt, parsedTransforms.size());

    for (size_t i = 0; i < parsedTransforms.size(); i++) {
        result.setValueAtIndex(rt, i, parsedTransforms[i]);
    }

    return result;
}

jsi::Value parser::Parser::getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj) {
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);
    
    auto sortedBreakpoints = state.getSortedBreakpointPairs();
    auto hasBreakpoints = !sortedBreakpoints.empty();
    auto currentBreakpoint = state.getCurrentBreakpointName();
    auto lastKnownDimensions = this->_unistylesRuntime->getCachedScreenDimensions();
    auto currentOrientation = lastKnownDimensions.width > lastKnownDimensions.height
        ? "landscape"
        : "portrait";

    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    // mq has the biggest priority, so check if first
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());
        auto mq = core::UnistylesMQ{propertyName};

        if (mq.isWithinTheWidthAndHeight(lastKnownDimensions)) {
            // we have direct hit
            return propertyValue;
        }
    }

    // check orientation breakpoints if user didn't register own breakpoint
    if (!hasBreakpoints && obj.hasProperty(rt, currentOrientation)) {
        return obj.getProperty(rt, currentOrientation);
    }

    if (!currentBreakpoint.has_value()) {
        return jsi::Value::undefined();
    }

    // if you're still here it means that there is no
    // matching mq nor default breakpoint, let's find the user defined breakpoint
    auto currentBreakpointIt = std::find_if(
        sortedBreakpoints.rbegin(),
        sortedBreakpoints.rend(),
        [&currentBreakpoint](const std::pair<std::string, double>& breakpoint){
            return breakpoint.first == currentBreakpoint.value();
        }
    );

    // look for any hit in reversed vector
    for (auto it = currentBreakpointIt; it != sortedBreakpoints.rend(); ++it) {
        auto breakpoint = it->first.c_str();

        if (obj.hasProperty(rt, breakpoint)) {
            return obj.getProperty(rt, breakpoint);
        }
    }

    return jsi::Value::undefined();
}

jsi::Object parser::Parser::parseVariants(jsi::Runtime& rt, jsi::Object& obj, Variants& variants) {
    jsi::Object parsedVariant = jsi::Object(rt);
    jsi::Array propertyNames = obj.getPropertyNames(rt);

    helpers::enumerateJSIObject(rt, obj, [&](const std::string& groupName, jsi::Value& groupValue) {
        // try to match groupName to selected variants
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

        // we've got a match, but we need to check some condition
        auto styles = this->getStylesForVariant(rt, groupValue.asObject(rt), selectedVariant);

        // oops, invalid variant
        if (styles.isUndefined() || !styles.isObject()) {
            return;
        }

        auto parsedNestedStyles = this->parseSecondLevel(rt, styles).asObject(rt);

        helpers::mergeJSIObjects(rt, parsedVariant, parsedNestedStyles);
    });

    return parsedVariant;
}

jsi::Value parser::Parser::getStylesForVariant(jsi::Runtime& rt, jsi::Object&& groupValue, std::optional<std::string> selectedVariant) {
    // if there is no value, let's try 'default'
    auto selectedVariantKey = selectedVariant.has_value()
        ? selectedVariant.value().c_str()
        : "default";

    if (groupValue.hasProperty(rt, selectedVariantKey)) {
        return groupValue.getProperty(rt, selectedVariantKey);
    }

    return jsi::Value::undefined();
}

jsi::Object parser::Parser::parseCompoundVariants(jsi::Runtime& rt, jsi::Object& obj, Variants& variants) {
    if (!obj.isArray(rt)) {
        return jsi::Object(rt);
    }

    jsi::Object parsedCompoundVariants = jsi::Object(rt);

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto valueObject = value.asObject(rt);

        // check if every condition for given compound variant is met
        if (this->shouldApplyCompoundVariants(rt, variants, valueObject)) {
            auto styles = valueObject.getProperty(rt, "styles");
            auto parsedNestedStyles = this->parseSecondLevel(rt, styles).asObject(rt);

            unistyles::helpers::mergeJSIObjects(rt, parsedCompoundVariants, parsedNestedStyles);
        }
    });

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

jsi::Value parser::Parser::parseSecondLevel(jsi::Runtime &rt, jsi::Value& nestedStyle) {
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

    if (helpers::isPlatformColor(rt, nestedObjectStyle)) {
        return jsi::Value(rt, nestedStyle);
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
            parsedStyle.setProperty(rt, propertyName.c_str(), parseTransforms(rt, nestedObjectStyle));

            return;
        }

        if (nestedObjectStyle.isArray(rt) && propertyName == "fontVariant") {
            parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);

            return;
        }

        parsedStyle.setProperty(rt, propertyName.c_str(), this->getValueFromBreakpoints(rt, nestedObjectStyle));
    });

    return parsedStyle;
}

Variants parser::Parser::variantsToPairs(jsi::Runtime& rt, jsi::Object&& variants) {
    Variants pairs{};
    
    helpers::enumerateJSIObject(rt, variants, [&](const std::string& variantName, jsi::Value& variantValue){
        if (variantValue.isUndefined() || variantValue.isNull()) {
            return;
        }

        if (variantValue.isBool()) {
            pairs.emplace_back(std::make_pair(variantName, variantValue.asBool() ? "true" : "false"));

            return;
        }

        if (variantValue.isString()) {
            pairs.emplace_back(std::make_pair(variantName, variantValue.asString(rt).utf8(rt)));
        }
    });
    
    return pairs;
}
