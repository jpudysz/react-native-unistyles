#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

jsi::Object parser::Parser::parseUnistyles(jsi::Runtime &rt, std::vector<core::Unistyle>& unistyles, Variants& variants) {
    jsi::Object reactNativeStyles = jsi::Object(rt);

    for (core::Unistyle& unistyle : unistyles) {
        if (unistyle.type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle, variants);

            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(result));
        }

        if (unistyle.type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle, variants);

            helpers::defineHiddenProperty(rt, reactNativeStyles, helpers::PROXY_FN_PREFIX + unistyle.styleKey, unistyle.rawValue.asFunction(rt));
            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(hostFn));
        }
    }

    return reactNativeStyles;
}

jsi::Function parser::Parser::createDynamicFunctionProxy(jsi::Runtime &rt, core::Unistyle& unistyle, Variants& variants) {
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

            return this->parseFirstLevel(rt, unistyle, variants);
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
    // todo
    return {};
}

jsi::Value parser::Parser::parseTransforms(jsi::Runtime& rt, jsi::Object& obj) {
    // todo
    return jsi::Value::undefined();
}

jsi::Value parser::Parser::getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object& obj) {
    // todo
    return jsi::Value::undefined();
}

jsi::Object parser::Parser::parseVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& obj) {
    // todo
    return jsi::Object(rt);
}

jsi::Object parser::Parser::parseCompoundVariants(jsi::Runtime& rt, Variants& variants, jsi::Object& obj) {
    // todo
    return jsi::Object(rt);
}

jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle, Variants& variants) {
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
        auto parsedVariant = this->parseVariants(rt, variants, propertyValueObject);
        
        helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);

        if (shouldParseCompoundVariants) {
            auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
            auto parsedCompoundVariants = this->parseCompoundVariants(rt, variants, compoundVariants);

            helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
        }
    }
    
    return parsedStyle;
}

jsi::Object parser::Parser::parseSecondLevel(jsi::Runtime &rt, jsi::Value& nestedObject) {
    // todo
    return jsi::Object(rt);
}
