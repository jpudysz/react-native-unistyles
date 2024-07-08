#include <folly/FBVector.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include "StyleSheetHolder.h"

using namespace facebook;

struct StyleSheetRegistry {
    StyleSheetRegistry(jsi::Runtime& rt): rt{rt} {};
    
    void add(jsi::Object styleSheet);
    
private:
    void addStyleSheetFunction(jsi::Function styleSheetFunction, int nextTag);
    
    jsi::Runtime& rt;
    folly::fbvector<StyleSheetHolder> styleSheets;
};
