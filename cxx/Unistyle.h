#pragma once

#include <folly/dynamic.h>
#include <folly/FBVector.h>
#include <jsi/jsi.h>
#include "Consts.h"
#include "Helpers.h"

using namespace facebook;

struct Unistyle {
    std::string name;
    UnistyleType type;
    jsi::Value rawStyle;
    jsi::Object style;
    folly::fbvector<int> nativeTags {};
    folly::fbvector<StyleDependencies> dependencies;

    // for dynamic functions
    std::optional<size_t> count;
    std::optional<folly::dynamic> arguments;

    Unistyle(
        jsi::Runtime& rt,
        UnistyleType type,
        std::string name,
        jsi::Value rawStyle
    ): name{name}, rawStyle{std::move(rawStyle)}, type{type}, style{jsi::Object(rt)} {
        this->parseStyle(rt);
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

    void parseStyle(jsi::Runtime& rt) {
        auto style = this->rawStyle.asObject(rt);

        this->style = jsi::Object(rt);

        unistyles::helpers::enumerateJSIObject(rt, style, [&, this](const std::string& propertyName, jsi::Value& propertyValue){
            // parse dependencies only once
            if (this->dependencies.empty() && propertyName == STYLE_DEPENDENCIES) {
                this->dependencies = this->parseDependencies(rt, propertyValue.asObject(rt));

                return;
            }

            if (propertyValue.isNumber() || propertyValue.isString()) {
                this->style.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

                return;
            }

            if (propertyValue.isNull() || propertyValue.isUndefined()) {
                this->style.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

                return;
            }

            if (!propertyValue.isObject()) {
                return;
            }

            auto obj = propertyValue.asObject(rt);

            if (obj.isFunction(rt)) {
                this->style.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), obj);

                return;
            }

            if (obj.isArray(rt)) {
                // todo handle

                return;
            }

            this->style.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), obj);
        });
    }
};
