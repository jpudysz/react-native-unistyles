#pragma once

#include <jsi/jsi.h>
#include "Unistyle.h"
#include "Helpers.h"
#include "UnistylesConstants.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

enum class StyleSheetType {
    Static,
    Themable,
    ThemableWithMiniRuntime
};

struct StyleSheet {
    StyleSheet(int tag, StyleSheetType type, jsi::Object rawValue): tag{tag}, type{type}, rawValue{std::move(rawValue)} {};
    
    StyleSheet(const StyleSheet&) = delete;
    StyleSheet(StyleSheet&& other) = delete;

    int tag;
    StyleSheetType type;
    jsi::Object rawValue;
    std::unordered_map<std::string, Unistyle::Shared> unistyles{};
    // without the Babel plugin, every dependency read by the StyleSheet function, shared by all of its unistyles
    std::vector<UnistyleDependency> runtimeDependencies{};

    inline void addRuntimeDependencies(const std::vector<UnistyleDependency>& dependencies) {
        for (const auto& dependency : dependencies) {
            if (std::find(this->runtimeDependencies.begin(), this->runtimeDependencies.end(), dependency) == this->runtimeDependencies.end()) {
                this->runtimeDependencies.push_back(dependency);
            }

            for (const auto& [_, unistyle] : this->unistyles) {
                unistyle->addRuntimeDependency(dependency);
            }
        }
    }
};

}
