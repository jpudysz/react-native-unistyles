#pragma once

#include <jsi/jsi.h>
#include "StyleSheet.h"
#include "Constants.h"

namespace margelo::nitro::unistyles::core {

struct JSI_EXPORT HostStyle : public jsi::HostObject {
    HostStyle(std::shared_ptr<StyleSheet> styleSheet): styleSheet{styleSheet} {};

    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt);
    jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& propNameId);
    void set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value);

private:
    std::shared_ptr<StyleSheet> styleSheet;
};

}
