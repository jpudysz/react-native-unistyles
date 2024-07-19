#pragma once

#include <jsi/jsi.h>
#include "UnistylesRuntime.h"
#include "Macros.h"
#include "Helpers.h"
#include "StyleSheetRegistry.h"
#include "HostStyle.h"
#include <map>

using namespace facebook;

using Getter = std::function<jsi::Value(jsi::Runtime& rt, std::string)>;
using Setter = std::function<std::optional<jsi::Value>(jsi::Runtime& rt, const jsi::Value&)>;

struct JSI_EXPORT StyleSheet : public jsi::HostObject {
    StyleSheet(jsi::Runtime& rt, std::shared_ptr<UnistylesRuntime> unistylesRuntime): styleSheetRegistry(rt, unistylesRuntime) {
        this->getters = {
            {"create", MAP_FN(create)},
            {"configure", MAP_FN(configure)},
        };

        this->unistylesRuntime = unistylesRuntime;
    }

    jsi::Value create(jsi::Runtime&, std::string);
    jsi::Value configure(jsi::Runtime&, std::string);
    void emitEvent(jsi::Runtime&, std::vector<StyleDependency>);
    void parseSettings(jsi::Runtime&, folly::dynamic& settings);
    void parseBreakpoints(jsi::Runtime& rt, jsi::Object &breakpoints);

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID&) override;
    void set(jsi::Runtime&, const jsi::PropNameID&, const jsi::Value&) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime&) override;

private:
    std::map<std::string, Getter> getters;
    std::map<std::string, Setter> setters;
    std::shared_ptr<UnistylesRuntime> unistylesRuntime;
    StyleSheetRegistry styleSheetRegistry;
};
