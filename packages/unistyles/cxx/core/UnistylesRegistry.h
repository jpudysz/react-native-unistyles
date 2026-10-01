#pragma once

#include "set"
#include <atomic>
#include <mutex>
#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include <react/renderer/uimanager/UIManager.h>
#include <unordered_map>
#include <unordered_set>
#include "Breakpoints.h"
#include "StyleSheetRegistry.h"
#include "StyleSheet.h"
#include "Unistyle.h"
#include "UnistyleData.h"
#include "ShadowTrafficController.h"

namespace margelo::nitro::unistyles::core {

struct UnistylesState;

using namespace facebook;
using namespace facebook::react;

using DependencyMap = std::unordered_map<const ShadowNodeFamily*, std::vector<std::shared_ptr<UnistyleData>>>;

struct UnistylesRegistry: public StyleSheetRegistry {
    static UnistylesRegistry& get();

    UnistylesRegistry(const UnistylesRegistry&) = delete;
    UnistylesRegistry(const UnistylesRegistry&&) = delete;

    bool shouldUsePointsForBreakpoints = false;

    void registerTheme(jsi::Runtime& rt, std::string name, jsi::Value& theme);
    void registerBreakpoints(std::vector<std::pair<std::string, double>>& sortedBreakpoints);
    void setPrefersAdaptiveThemes(bool prefersAdaptiveThemes);
    void setInitialThemeName(std::string themeName);
    void updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback);

    UnistylesState& getState();
    void createState();
    std::vector<std::shared_ptr<core::StyleSheet>> getStyleSheetsToRefresh(std::vector<UnistyleDependency>& unistylesDependencies);
    void linkShadowNodeWithUnistyle(jsi::Runtime& rt, const ShadowNodeFamily*, std::vector<std::shared_ptr<UnistyleData>>& unistylesData, std::optional<folly::dynamic> initialScopedUpdate = std::nullopt);
    void unlinkShadowNodeWithUnistyles(const ShadowNodeFamily*);
    void suspendShadowNode(const ShadowNodeFamily*);
    bool isSuspended(const ShadowNodeFamily*) const noexcept;
    std::shared_ptr<core::StyleSheet> addStyleSheet(jsi::Runtime& rt, core::StyleSheetType type, jsi::Object&& rawValue);
    DependencyMap buildDependencyMap(std::vector<UnistyleDependency>& deps);
    void shadowLeafUpdateFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Value& maybePressableId);
    shadow::ShadowTrafficController trafficController{};
    const std::optional<std::string> getScopedTheme();
    void removeDuplicatedUnistyles(const ShadowNodeFamily* shadowNodeFamily, std::vector<core::Unistyle::Shared>& unistyles);
    void setScopedTheme(std::optional<std::string> themeName);
    core::Unistyle::Shared getUnistyleById(std::string unistyleID);
    void destroy();

    // Tracks the JS runtime that currently owns Unistyles state and arbitrates who may
    // wipe the (single, global) state. On an OTA / hard reload the previous runtime is
    // torn down asynchronously while the new runtime has already installed its bindings
    // and re-created the state; without arbitration the previous runtime's late teardown
    // would clear the new runtime's freshly configured state and crash with "Unistyles
    // was loaded, but it's not configured". Runtime pointers are only ever compared for
    // identity, never dereferenced, so a stale pointer is safe.

    // A runtime claims ownership when it installs its bindings (newest wins). If a
    // different runtime owned the state before, that state is now defunct, so wipe it
    // here — as the successor — rather than relying on the previous runtime's racy async
    // teardown that shares this same global state.
    void takeOwnership(jsi::Runtime* rt) {
        // Lock so the check-and-destroy below is atomic w.r.t. releaseOwnership, which
        // runs on a different thread during an OTA hard reload. Without it, a superseded
        // runtime's releaseOwnership could pass its owner check, get preempted while this
        // runtime configures, then resume and destroy() the new state.
        std::lock_guard<std::mutex> lock(this->_ownershipMutex);

        if (this->_activeRuntime != nullptr && this->_activeRuntime != rt) {
            this->destroy();
        }

        this->_activeRuntime = rt;
    }

    // A runtime releases ownership when it is invalidated. Only the current owner may
    // wipe — a runtime that was already superseded was cleaned up when its successor
    // took ownership, so its late teardown must not touch the new owner's state.
    void releaseOwnership(jsi::Runtime* rt) {
        // Serialized with takeOwnership (see above) so the check-and-destroy is atomic
        // and a late teardown can't wipe a newer runtime's freshly configured state.
        std::lock_guard<std::mutex> lock(this->_ownershipMutex);

        if (this->_activeRuntime == rt) {
            this->destroy();
            this->_activeRuntime = nullptr;
        }
    }

private:
    UnistylesRegistry() = default;

    jsi::Runtime* _activeRuntime = nullptr;
    std::mutex _ownershipMutex;
    static std::atomic<int> _nextStyleSheetTag;
    std::optional<std::string> _scopedTheme{};
    std::unique_ptr<UnistylesState> _state{};
    std::unordered_map<int, std::shared_ptr<core::StyleSheet>> _styleSheetRegistry{};
    std::unordered_map<const ShadowNodeFamily*, std::vector<std::shared_ptr<UnistyleData>>> _shadowRegistry{};
    std::unordered_set<const ShadowNodeFamily*> _suspendedFamilies{};
};

inline UnistylesRegistry& UnistylesRegistry::get() {
    static UnistylesRegistry cache;

    return cache;
}

}
