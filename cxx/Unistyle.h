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

            // ignore non objects at this point
            if (!propertyValue.isObject()) {
                continue;
            }

            auto obj = propertyValue.asObject(rt);

            if (obj.isFunction(rt)) {
                parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), obj);

                continue;
            }

            // todo check other styles that are arrays as of 0.75
            // 'transform' or 'fontVariant'
            if (obj.isArray(rt)) {
                // todo handle

                continue;
            }

            // todo check other styles that are objects as of 0.75
            // 'shadowOffset' or 'textShadowOffset' or 'PlatformColor'
            // 'variants' or 'compoundVariants'
            // 'mq' or 'breakpoints'
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), getValueFromBreakpoints(rt, propertyValue.asObject(rt)));
        }

        return parsedStyle;
    }

    jsi::Value getValueFromBreakpoints(jsi::Runtime& rt, jsi::Object&& obj) {
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
};
