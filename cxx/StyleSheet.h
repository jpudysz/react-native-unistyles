#pragma once

#include <jsi/jsi.h>
#include "UnistylesRuntime.h"
#include "Macros.h"
#include "StyleSheetRegistry.h"
#include <map>

using namespace facebook;

using Getter = std::function<jsi::Value(jsi::Runtime& rt, std::string)>;
using Setter = std::function<std::optional<jsi::Value>(jsi::Runtime& rt, const jsi::Value&)>;

struct JSI_EXPORT StyleSheet : public jsi::HostObject {
    std::function<void(int nativeTag)> updateView;
    
    void setOnViewUpdate(std::function<void(int nativeTag)> callback) {
        this->updateView = callback;
    }
    
    StyleSheet(jsi::Runtime& rt, std::shared_ptr<UnistylesRuntime> unistylesRuntime): styleSheetRegistry(rt) {
        this->getters = {
            {"create", MAP_FN(create)},
            {"addConfig", MAP_FN(addConfig)},
        };
        
        this->unistylesRuntime = unistylesRuntime;
    }
    
    jsi::Value create(jsi::Runtime&, std::string);
    jsi::Value addConfig(jsi::Runtime&, std::string);
    
    jsi::Value get(jsi::Runtime&, const jsi::PropNameID&) override;
    void set(jsi::Runtime&, const jsi::PropNameID&, const jsi::Value&) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime&) override;
    
private:
    std::map<std::string, Getter> getters;
    std::map<std::string, Setter> setters;
    std::shared_ptr<UnistylesRuntime> unistylesRuntime;
    StyleSheetRegistry styleSheetRegistry;
};
