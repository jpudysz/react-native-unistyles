#pragma once

#include <folly/FBVector.h>
#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include "Unistyle.h"
#include "Helpers.h"
#include "Consts.h"

using namespace facebook;

enum class StyleSheetType {
    Static,
    Themable,
    ThemableWithMiniRuntime
};

struct StyleSheetHolder {
    int tag;
    StyleSheetType type;
    jsi::Object value;
    folly::fbvector<Unistyle> styles {};
    Variants variants {};

    StyleSheetHolder(
        int tag,
        StyleSheetType type,
        jsi::Object value
    ): tag{tag}, type{type}, value{std::move(value)} {}

    void addVariants(jsi::Runtime& rt, jsi::Value&& maybeVariants) {
        if (maybeVariants.isUndefined()) {
            return;
        }

        auto variants = maybeVariants.asObject(rt);

        jsi::Array propertyNames = variants.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        if (length == 0) {
            return;
        }

        for (size_t i = 0; i < length; i++) {
            auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
            auto propertyValue = variants.getProperty(rt, propertyName.c_str());

            if (propertyValue.isUndefined() || propertyValue.isNull()) {
                continue;
            }

            if (propertyValue.isBool()) {
                this->variants.push_back(std::make_pair(propertyName, propertyValue.asBool() ? "true" : "false"));

                continue;
            }

            if (propertyValue.isString()) {
                this->variants.push_back(std::make_pair(propertyName, propertyValue.asString(rt).utf8(rt)));
            }
        }
    }
};
