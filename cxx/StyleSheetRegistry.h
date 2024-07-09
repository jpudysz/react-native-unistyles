#pragma once

#include <folly/FBVector.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include "StyleSheetHolder.h"
#include "UnistylesRuntime.h"
#include "Helpers.h"
#include "Consts.h"

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry(jsi::Runtime& rt, std::shared_ptr<UnistylesRuntime> unistylesRuntime): rt{rt}, unistylesRuntime{unistylesRuntime} {}
    
    StyleSheetHolder& add(jsi::Object);
    jsi::Object dereferenceStyleSheet(StyleSheetHolder&);
    
private:
    jsi::Value getCurrentTheme();
    jsi::Value getMiniRuntime();
    jsi::Object wrapInHostFunction(StyleSheetHolder&, jsi::Object&);
    void addStyleSheetFunction(jsi::Function, int);
    
    jsi::Runtime& rt;
    jsi::Value currentTheme;
    jsi::Value miniRuntime;
    std::shared_ptr<UnistylesRuntime> unistylesRuntime;
    folly::fbvector<StyleSheetHolder> styleSheets;
};
