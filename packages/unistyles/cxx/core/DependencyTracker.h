#pragma once

#include <jsi/jsi.h>
#include <algorithm>
#include <optional>
#include <unordered_map>
#include <vector>
#include "NativePlatform.h"

namespace margelo::nitro::unistyles::core {

using namespace facebook;

// Without the Babel plugin (react-native-unistyles/metro) StyleSheets don't carry `uni__dependencies`.
// Instead, the mini runtime records what a StyleSheet or a dynamic function reads while it runs.
struct DependencyTracker {
    using Dependencies = std::vector<UnistyleDependency>;

    // every read of the mini runtime lands in the innermost scope, reads outside of any scope are ignored
    struct Scope {
        Scope() {
            scopes().push_back(&this->_dependencies);
        }

        ~Scope() {
            scopes().pop_back();
        }

        Scope(const Scope&) = delete;
        Scope(Scope&&) = delete;

        const Dependencies& getDependencies() const {
            return this->_dependencies;
        }

    private:
        Dependencies _dependencies{};
    };

    static void record(UnistyleDependency dependency) {
        auto& activeScopes = scopes();

        if (activeScopes.empty()) {
            return;
        }

        auto* dependencies = activeScopes.back();

        if (std::find(dependencies->begin(), dependencies->end(), dependency) == dependencies->end()) {
            dependencies->push_back(dependency);
        }
    }

private:
    // StyleSheets run only on the JS thread
    static std::vector<Dependencies*>& scopes() {
        thread_local std::vector<Dependencies*> activeScopes{};

        return activeScopes;
    }
};

// mini runtime passed to StyleSheets, records the dependency of every property that is read
// eg. rt.screen.width -> Dimensions, rt.insets.top -> Insets, rt.insets.ime -> Ime
class TrackedMiniRuntime: public jsi::HostObject {
public:
    using DependencyMap = std::unordered_map<std::string, UnistyleDependency>;

    TrackedMiniRuntime(jsi::Object target, const DependencyMap& dependencies, std::optional<UnistyleDependency> fallbackDependency)
        : _target{std::move(target)}, _dependencies{dependencies}, _fallbackDependency{fallbackDependency} {}

    static jsi::Value create(jsi::Runtime& rt, jsi::Value&& miniRuntime) {
        static const DependencyMap dependencies = {
            {"themeName", UnistyleDependency::THEMENAME},
            {"breakpoint", UnistyleDependency::BREAKPOINTS},
            {"hasAdaptiveThemes", UnistyleDependency::ADAPTIVETHEMES},
            {"colorScheme", UnistyleDependency::COLORSCHEME},
            {"screen", UnistyleDependency::DIMENSIONS},
            {"contentSizeCategory", UnistyleDependency::CONTENTSIZECATEGORY},
            {"pixelRatio", UnistyleDependency::PIXELRATIO},
            {"fontScale", UnistyleDependency::FONTSCALE},
            {"rtl", UnistyleDependency::RTL},
            {"statusBar", UnistyleDependency::STATUSBAR},
            {"navigationBar", UnistyleDependency::NAVIGATIONBAR},
            {"isPortrait", UnistyleDependency::ORIENTATION},
            {"isLandscape", UnistyleDependency::ORIENTATION}
            // insets are tracked by their own object, ime is a separate dependency
        };

        return wrap(rt, miniRuntime.asObject(rt), dependencies, std::nullopt);
    }

    jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& propNameId) override {
        auto propertyName = propNameId.utf8(rt);
        auto it = this->_dependencies.find(propertyName);

        if (it != this->_dependencies.end()) {
            DependencyTracker::record(it->second);
        } else if (this->_fallbackDependency.has_value() && this->_target.hasProperty(rt, propNameId)) {
            DependencyTracker::record(this->_fallbackDependency.value());
        }

        if (propertyName == "insets") {
            return this->getInsets(rt);
        }

        return this->_target.getProperty(rt, propNameId);
    }

    void set(jsi::Runtime& rt, const jsi::PropNameID& propNameId, const jsi::Value& value) override {
        this->_target.setProperty(rt, propNameId, value);
    }

    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override {
        auto propertyNames = this->_target.getPropertyNames(rt);
        size_t length = propertyNames.size(rt);
        std::vector<jsi::PropNameID> result{};

        result.reserve(length);

        for (size_t i = 0; i < length; i++) {
            result.emplace_back(jsi::PropNameID::forString(rt, propertyNames.getValueAtIndex(rt, i).asString(rt)));
        }

        return result;
    }

private:
    jsi::Object _target;
    DependencyMap _dependencies;
    std::optional<UnistyleDependency> _fallbackDependency;
    std::optional<jsi::Value> _insets = std::nullopt;

    static jsi::Value wrap(jsi::Runtime& rt, jsi::Object&& target, const DependencyMap& dependencies, std::optional<UnistyleDependency> fallbackDependency) {
        auto trackedObject = std::make_shared<TrackedMiniRuntime>(std::move(target), dependencies, fallbackDependency);

        return jsi::Object::createFromHostObject(rt, std::move(trackedObject));
    }

    // the same object for every read, so rt.insets === rt.insets
    jsi::Value getInsets(jsi::Runtime& rt) {
        if (this->_insets.has_value()) {
            return jsi::Value(rt, this->_insets.value());
        }

        auto insets = this->_target.getProperty(rt, "insets");

        if (!insets.isObject()) {
            return insets;
        }

        static const DependencyMap insetsDependencies = {
            {"ime", UnistyleDependency::IME}
        };

        this->_insets = wrap(rt, insets.asObject(rt), insetsDependencies, UnistyleDependency::INSETS);

        return jsi::Value(rt, this->_insets.value());
    }
};

}
