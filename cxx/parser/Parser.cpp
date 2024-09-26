#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;
using namespace facebook::react;

using Variants = std::vector<std::pair<std::string, std::string>>;

// called only once while processing StyleSheet.create
void parser::Parser::buildUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    jsi::Object unwrappedStyleSheet = this->unwrapStyleSheet(rt, styleSheet);

    helpers::enumerateJSIObject(rt, unwrappedStyleSheet, [&](const std::string& styleKey, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "style with name '" + styleKey + "' is not a function or object.");

        jsi::Object styleValue = propertyValue.asObject(rt);

        styleSheet->unistyles[styleKey] = std::make_shared<Unistyle>(
            styleValue.isFunction(rt) ? UnistyleType::DynamicFunction : UnistyleType::Object,
            styleKey,
            styleValue
        );
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

// parses all unistyles in StyleSheet
void parser::Parser::parseUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    for (const auto& [_, unistyle] : styleSheet->unistyles) {
        if (unistyle->type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle, styleSheet->variants);

            unistyle->parsedStyle = std::move(result);
        }

        if (unistyle->type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle, styleSheet->variants);

            // defer parsing dynamic functions
            unistyle->proxiedFunction = std::move(hostFn);
        }
    }
}

// rebuild all unistyles in StyleSheet that depends on variants
void parser::Parser::rebuildUnistylesWithVariants(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    for (const auto& [_, unistyle] : styleSheet->unistyles) {
        if (!unistyle->dependsOn(UnistyleDependency::VARIANTS)) {
            continue;
        }

        this->rebuildUnistyle(rt, styleSheet, unistyle);
    }
}

// rebuild all unistyles that are affected by platform event
void parser::Parser::rebuildUnistylesInDependencyMap(jsi::Runtime& rt, DependencyMap& dependencyMap) {
    for (const auto& [styleSheet, map] : dependencyMap) {
        jsi::Object unwrappedStyleSheet = this->unwrapStyleSheet(rt, styleSheet);

        for (const auto& [shadowNode, unistyles] : map) {
            for (const auto& unistyle : unistyles) {
                // StyleSheet might have styles that are not affected
                if (!unwrappedStyleSheet.hasProperty(rt, unistyle->styleKey.c_str())) {
                    continue;
                }

                unistyle->rawValue = unwrappedStyleSheet.getProperty(rt, unistyle->styleKey.c_str()).asObject(rt);
                this->rebuildUnistyle(rt, styleSheet, unistyle);
            }
        }
    }
}

// rebuild single unistyle
void parser::Parser::rebuildUnistyle(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet, Unistyle::Shared unistyle) {
    if (unistyle->type == core::UnistyleType::Object) {
        auto result = this->parseFirstLevel(rt, unistyle, styleSheet->variants);

        unistyle->parsedStyle = std::move(result);
    }

    // for functions we need to call memoized function
    // with last know arguments and parse it with new theme and mini runtime
    if (unistyle->type == core::UnistyleType::DynamicFunction) {
        auto maybeMetadata = unistyle->dynamicFunctionMetadata;

        helpers::assertThat(rt, maybeMetadata.has_value(), "Your dynamic function '" + unistyle->styleKey + "' has no metadata and can't be processed.");

        // convert arguments to jsi::Value
        auto metadata = unistyle->dynamicFunctionMetadata.value();
        std::vector<jsi::Value> args{};

        for (int i = 0; i < metadata.count; i++) {
            folly::dynamic& arg = metadata.arguments.at(i);

            args.emplace_back(jsi::valueFromDynamic(rt, arg));
        }

        const jsi::Value *argStart = args.data();

        // call cached function with memoized arguments
        auto functionResult = unistyle->proxiedFunction.value().callAsConstructor(rt, argStart, metadata.count).asObject(rt);

        // todo this is weird syntax, should I introduce another property for mid conversion?
        unistyle->parsedStyle = std::move(functionResult);
        unistyle->parsedStyle = this->parseFirstLevel(rt, unistyle, styleSheet->variants);
    }
}

// convert dependency map to shadow tree updates
shadow::ShadowLeafUpdates parser::Parser::dependencyMapToShadowLeafUpdates(DependencyMap& dependencyMap) {
    shadow::ShadowLeafUpdates updates;
    auto& rt = this->_unistylesRuntime->getRuntime();

    for (const auto& [styleSheet, map] : dependencyMap) {
        for (const auto& [shadowNode, unistyles] : map) {
            for (const auto& unistyle : unistyles) {
                auto rawProps = this->parseStylesToShadowTreeStyles(rt, unistyle->parsedStyle.value());

                if (updates.contains(shadowNode)) {
                    updates[shadowNode].emplace_back(std::move(rawProps));

                    continue;
                }

                updates.emplace(shadowNode, std::vector<RawProps>{std::move(rawProps)});
            }
        }
    }

    return updates;
}

// convert jsi::Value arguments to folly::dynamic
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

// first level of StyleSheet, we can expect here different properties than on second level
// eg. variants, compoundVariants, mq, breakpoints etc.
jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime& rt, Unistyle::Shared unistyle, Variants& variants) {
    // for objects - we simply operate on them
    // for functions we need to work on the mid-saved result (object)
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

        // ignore web styles
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

// function replaces original user dynamic function with additional logic to memoize arguments
jsi::Function parser::Parser::createDynamicFunctionProxy(jsi::Runtime& rt, Unistyle::Shared unistyle, Variants& variants) {
    auto unistylesRuntime = this->_unistylesRuntime;

    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forUtf8(rt, unistyle->styleKey),
        1,
        [this, unistylesRuntime, unistyle, &variants](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            auto thisObject = thisVal.asObject(rt);
            auto parser = parser::Parser(unistylesRuntime);

            // call user function
            auto result = unistyle->rawValue.asFunction(rt).call(rt, args, count);

            // memoize metadata to call it later
            unistyle->dynamicFunctionMetadata = core::DynamicFunctionMetadata{
                count,
                this->parseDynamicFunctionArguments(rt, count, args)
            };

            unistyle->parsedStyle = jsi::Value(rt, result).asObject(rt);

            return this->parseFirstLevel(rt, unistyle, variants);
    });
}

// function convert babel generated dependencies to C++ dependencies
std::vector<UnistyleDependency> parser::Parser::parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies) {
    helpers::assertThat(rt, dependencies.isArray(rt), "babel transform is invalid. Unexpected type for dependencies. Please report new Github issue.");

    std::vector<UnistyleDependency> parsedDependencies;

    helpers::iterateJSIArray(rt, dependencies.asArray(rt), [&](size_t i, jsi::Value& value){
        auto dependency = static_cast<UnistyleDependency>(value.asNumber());

        parsedDependencies.push_back(dependency);
    });

    return parsedDependencies;
}

// eg. [{ scale: 2 }, { translateX: 100 }]
jsi::Value parser::Parser::parseTransforms(jsi::Runtime& rt, jsi::Object& obj) {
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

// find value based on breakpoints and mq
jsi::Value parser::Parser::getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj) {
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);

    auto sortedBreakpoints = state.getSortedBreakpointPairs();
    auto hasBreakpoints = !sortedBreakpoints.empty();
    auto currentBreakpoint = state.getCurrentBreakpointName();
    auto dimensions = this->_unistylesRuntime->getScreen();
    auto currentOrientation = dimensions.width > dimensions.height
        ? "landscape"
        : "portrait";

    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    // mq has the biggest priority, so check if first
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());
        auto mq = core::UnistylesMQ{propertyName};

        if (mq.isWithinTheWidthAndHeight(dimensions)) {
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

    // at this point we have no match, return undefined
    return jsi::Value::undefined();
}

// parse all types of variants
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

// helpers function to support 'default' variants
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

// get styles from compound variants based on selected variants
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

// check every condition in compound variants, support boolean variants
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

// second level of parser
// we expect here only primitives, arrays and objects
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

// helpers function that convert variants from JS to C++ variants
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

// convert jsi::Object to RawValue with int colors
RawProps parser::Parser::parseStylesToShadowTreeStyles(jsi::Runtime& rt, jsi::Object& styles) {
    jsi::Object convertedStyles = jsi::Object(rt);
    auto& state = core::UnistylesRegistry::get().getState(rt);

    helpers::enumerateJSIObject(rt, styles, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (this->isColor(propertyName)) {
            return convertedStyles.setProperty(rt, propertyName.c_str(), jsi::Value(state.parseColor(propertyValue)));
        }

        convertedStyles.setProperty(rt, propertyName.c_str(), propertyValue);
    });

    return RawProps(rt, std::move(convertedStyles));
}

// check is styleKey contains color
bool parser::Parser::isColor(const std::string& propertyName) {
    std::string str = propertyName;
    std::transform(str.begin(), str.end(), str.begin(), ::tolower);

    return str.find("color") != std::string::npos;
}
