#pragma once

#include <folly/FBVector.h>
#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include "Unistyle.h"
#include "Helpers.h"

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

    StyleSheetHolder(
        int tag,
        StyleSheetType type,
        jsi::Object value
    ): tag{tag}, type{type}, value{std::move(value)} {}
    
    void parseStyles(jsi::Runtime&, jsi::Object&);
};
