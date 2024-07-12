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
    folly::fbvector<int> nativeTags {};
    folly::fbvector<StyleDependencies> dependencies;

    // for dynamic functions
    std::optional<size_t> count;
    std::optional<folly::dynamic> arguments;

    Unistyle(
        UnistyleType type,
        std::string name,
        jsi::Value rawStyle
    ): name{name}, rawStyle{std::move(rawStyle)}, type{type} {}
    
    Unistyle(Unistyle &&src) {
        this->name = std::move(src.name);
        this->type = src.type;
        this->rawStyle = std::move(src.rawStyle);
        this->nativeTags = std::move(src.nativeTags);
        this->dependencies = std::move(src.dependencies);
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

    jsi::Object parseStyle(jsi::Runtime& rt) {
        auto style = this->rawStyle.asObject(rt);
        auto parsedStyle = jsi::Object(rt);
        
        jsi::Array propertyNames = style.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = style.getProperty(rt, propertyName.c_str());

            // parse dependencies only once
            if (this->dependencies.empty() && propertyName == STYLE_DEPENDENCIES) {
                this->dependencies = this->parseDependencies(rt, propertyValue.asObject(rt));

                continue;;
            }
            
            if (propertyValue.isNumber() || propertyValue.isString()) {
               parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

               continue;
           }

           if (propertyValue.isNull() || propertyValue.isUndefined()) {
               parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

               continue;
           }

           if (!propertyValue.isObject()) {
               continue;
           }

           auto obj = propertyValue.asObject(rt);

           if (obj.isFunction(rt)) {
               parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), obj);

               continue;
           }

           if (obj.isArray(rt)) {
               // todo handle

               continue;
           }

           parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);
        }

        return parsedStyle;
    }
};
