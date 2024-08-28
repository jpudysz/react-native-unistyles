#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;

jsi::Object parser::Parser::parseUnistyles(jsi::Runtime &rt, std::vector<core::Unistyle>& unistyles) {
    jsi::Object reactNativeStyles = jsi::Object(rt);

    for (core::Unistyle& unistyle : unistyles) {
        if (unistyle.type == core::UnistyleType::Object) {
            auto result = parser::Parser::parseFirstLevel(rt, unistyle);

            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(result));
        }

        if (unistyle.type == core::UnistyleType::DynamicFunction) {
            auto hostFn = parser::Parser::createDynamicFunctionProxy(rt, unistyle);

            helpers::defineHiddenProperty(rt, reactNativeStyles, helpers::PROXY_FN_PREFIX + unistyle.styleKey, unistyle.rawValue.asFunction(rt));
            reactNativeStyles.setProperty(rt, jsi::PropNameID::forUtf8(rt, unistyle.styleKey), std::move(hostFn));
        }
    }

    return reactNativeStyles;
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

            // save function metadata if not present
            if (!unistyle.dynamicFunctionMetadata.has_value()) {
                unistyle.dynamicFunctionMetadata = std::make_pair(count, parser::Parser::parseDynamicFunctionArguments(rt, count, args));
            }

            return result;
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

jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime &rt, core::Unistyle& unistyle) {
    return jsi::Object(rt);
}
