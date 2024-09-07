#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

// parse deeply StyleSheet of styles represented as Unistyles
jsi::Object parser::Parser::parseUnistyles(jsi::Runtime &rt, std::vector<core::Unistyle>& unistyles) {
    jsi::Object reactNativeStyles = jsi::Object(rt);

    for (core::Unistyle& unistyle : unistyles) {
        if (unistyle.type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle);

            unistyle.parsedStyle = jsi::Value(rt, result).asObject(rt);

            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(result));
        }

        if (unistyle.type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle);

            helpers::defineHiddenProperty(rt, reactNativeStyles, helpers::PROXY_FN_PREFIX + unistyle.styleKey, unistyle.rawValue.asFunction(rt));
            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(hostFn));
        }
    }

    return reactNativeStyles;
}

// parse flat single Unistyle
void parser::Parser::parseUnistyle(jsi::Runtime& rt, core::Unistyle& unistyle) {
    if (unistyle.type == core::UnistyleType::Object) {
        auto result = this->parseFirstLevel(rt, unistyle);

        unistyle.parsedStyle = std::move(result);
    }

    if (unistyle.type == core::UnistyleType::DynamicFunction) {
        helpers::assertThat(rt, unistyle.dynamicFunctionMetadata.has_value(), "function has not metadata. Unistyles is not able to call it from C++.");

        auto metadata = unistyle.dynamicFunctionMetadata.value();

        // create vector of arguments
        std::vector<jsi::Value> args{};

        for (int i = 0; i < metadata.count; i++) {
            folly::dynamic& arg = metadata.arguments.at(i);

            args.emplace_back(jsi::valueFromDynamic(rt, arg));
        }

        const jsi::Value *argStart = args.data();

        auto rawResult = unistyle.rawValue.asFunction(rt).callAsConstructor(rt, argStart, metadata.count).asObject(rt);

        unistyle.parsedStyle = std::move(rawResult);

        auto result = this->parseFirstLevel(rt, unistyle);

        unistyle.parsedStyle = std::move(result);
    }
}

parser::ViewUpdates parser::Parser::unistylesToViewUpdates(jsi::Runtime& rt, std::vector<core::Unistyle*>& unistyles) {
    parser::ViewUpdates updates{};

    std::for_each(unistyles.begin(), unistyles.end(), [&](const core::Unistyle* unistyle){
        jsi::Object layoutProps = jsi::Object(rt);
        jsi::Object uiProps = jsi::Object(rt);

        helpers::enumerateJSIObject(rt, unistyle->parsedStyle.value(), [&](const std::string propertyName, jsi::Value& propertyValue){
            bool isLayoutProp = parser::isLayoutProp(propertyName);

            isLayoutProp
                ? layoutProps.setProperty(rt, propertyName.c_str(), propertyValue)
                : uiProps.setProperty(rt, propertyName.c_str(), propertyValue);
        });

        std::for_each(unistyle->nativeTags.begin(), unistyle->nativeTags.end(), [&](int nativeTag){
            jsi::Array layoutNames = layoutProps.getPropertyNames(rt);
            jsi::Array uiNames = uiProps.getPropertyNames(rt);

            auto& ref = updates.emplace_back(nativeTag, jsi::Value(rt, layoutProps), jsi::Value(rt, uiProps));

            ref.hasLayoutProps = layoutNames.size(rt) > 0;
            ref.hasUIProps = uiNames.size(rt) > 0;
        });
    });

    return updates;
}

void parser::Parser::parseUnistyleToJSIObject(jsi::Runtime& rt, core::Unistyle& unistyle, jsi::Object& target) {
    if (unistyle.type == core::UnistyleType::Object) {
        auto result = this->parseFirstLevel(rt, unistyle);

        unistyle.parsedStyle = jsi::Value(rt, result).asObject(rt);

        target.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(result));
    }

    if (unistyle.type == core::UnistyleType::DynamicFunction) {
        auto hostFn = this->createDynamicFunctionProxy(rt, unistyle);

        helpers::defineHiddenProperty(rt, target, helpers::PROXY_FN_PREFIX + unistyle.styleKey, unistyle.rawValue.asFunction(rt));
        target.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(hostFn));
    }
}

jsi::Function parser::Parser::createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle) {
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

            // save function metadata to call it later
            unistyle.dynamicFunctionMetadata = core::DynamicFunctionMetadata{
                count,
                this->parseDynamicFunctionArguments(rt, count, args)
            };

            unistyle.parsedStyle = jsi::Value(rt, result).asObject(rt);

            return this->parseFirstLevel(rt, unistyle);
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

std::vector<core::UnistyleDependency> parser::Parser::parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies) {
    helpers::assertThat(rt, dependencies.isArray(rt), "babel transform is invalid. Unexpected type for dependencies. Please report new Github issue.");

    std::vector<core::UnistyleDependency> parsedDependencies;

    helpers::iterateJSIArray(rt, dependencies.asArray(rt), [&](size_t i, jsi::Value& value){
        auto dependency = static_cast<core::UnistyleDependency>(value.asNumber());

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
    auto settings = this->settings.get();
    auto hasBreakpoints = !settings->sortedBreakpointPairs.empty();
    auto currentBreakpoint = settings->currentBreakpointName;
    auto currentOrientation = settings->screenDimensions.width > settings->screenDimensions.height
        ? "landscape"
        : "portrait";

    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    // mq has the biggest priority, so check if first
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());
        auto mq = core::UnistylesMQ{propertyName};

        if (mq.isWithinTheWidthAndHeight(settings->screenDimensions)) {
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
        settings->sortedBreakpointPairs.rbegin(),
        settings->sortedBreakpointPairs.rend(),
        [&currentBreakpoint](const std::pair<std::string, double>& breakpoint){
            return breakpoint.first == currentBreakpoint.value();
        }
    );

    // look for any hit in reversed vector
    for (auto it = currentBreakpointIt; it != settings->sortedBreakpointPairs.rend(); ++it) {
        auto breakpoint = it->first.c_str();

        if (obj.hasProperty(rt, breakpoint)) {
            return obj.getProperty(rt, breakpoint);
        }
    }

    return jsi::Value::undefined();
}

jsi::Object parser::Parser::parseVariants(jsi::Runtime& rt, jsi::Object& obj) {
    auto settings = this->settings.get();
    jsi::Object parsedVariant = jsi::Object(rt);
    jsi::Array propertyNames = obj.getPropertyNames(rt);

    helpers::enumerateJSIObject(rt, obj, [&](const std::string& groupName, jsi::Value& groupValue) {
        // try to match groupName to selected variants
        auto it = std::find_if(
            settings->variants.cbegin(),
            settings->variants.cend(),
            [&groupName](auto& variant){
                return variant.first == groupName;
            }
        );

        auto selectedVariant = it != settings->variants.end()
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

jsi::Object parser::Parser::parseCompoundVariants(jsi::Runtime& rt, jsi::Object& obj) {
    if (!obj.isArray(rt)) {
        return jsi::Object(rt);
    }

    auto settings = this->settings.get();
    jsi::Object parsedCompoundVariants = jsi::Object(rt);

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto valueObject = value.asObject(rt);

        // check if every condition for given compound variant is met
        if (this->shouldApplyCompoundVariants(rt, settings->variants, valueObject)) {
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

jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle) {
    auto settings = this->settings.get();
    // for objects - we simply operate on them
    // for functions we need to work on the saved result (object)
    auto& style = unistyle.type == core::UnistyleType::Object
        ? unistyle.rawValue
        : unistyle.parsedStyle.value();
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

    if (shouldParseVariants && !settings->variants.empty()) {
        auto propertyValueObject = style.getProperty(rt, "variants").asObject(rt);
        auto parsedVariant = this->parseVariants(rt, propertyValueObject);

        helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);

        if (shouldParseCompoundVariants) {
            auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
            auto parsedCompoundVariants = this->parseCompoundVariants(rt, compoundVariants);

            helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
        }
    }

    return parsedStyle;
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
