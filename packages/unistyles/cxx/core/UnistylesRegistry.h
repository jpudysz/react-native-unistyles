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

struct LinkedFamily {
    std::shared_ptr<const ShadowNodeFamily> family;
    std::vector<std::shared_ptr<UnistyleData>> unistyles;
    bool isSuspended = false;
};

struct LinkedFamilySnapshot {
    std::shared_ptr<const ShadowNodeFamily> family;
    std::vector<std::shared_ptr<UnistyleData>> unistyles;
    bool isSuspended = false;
    bool isOwnedOnlyByUnistyles = false;
};

struct UnistylesRegistry: public StyleSheetRegistry {
    static UnistylesRegistry& get();

    UnistylesRegistry(const UnistylesRegistry&) = delete;
    UnistylesRegistry(const UnistylesRegistry&&) = delete;

    bool shouldUsePointsForBreakpoints = false;

    void registerTheme(jsi::Runtime& rt, uint64_t generation, std::string name, jsi::Value& theme);
    void registerBreakpoints(std::vector<std::pair<std::string, double>>& sortedBreakpoints);
    void setPrefersAdaptiveThemes(bool prefersAdaptiveThemes);
    void setInitialThemeName(std::string themeName);
    void updateTheme(jsi::Runtime& rt, uint64_t generation, std::string& themeName, jsi::Function&& callback);

    UnistylesState& getState();
    void createState();
    std::vector<std::shared_ptr<core::StyleSheet>> getStyleSheetsToRefresh(std::vector<UnistyleDependency>& unistylesDependencies);
    void linkShadowNodeWithUnistyle(jsi::Runtime& rt, uint64_t generation, const std::shared_ptr<const ShadowNodeFamily>& shadowNodeFamily, std::vector<std::shared_ptr<UnistyleData>>& unistylesData, std::optional<folly::dynamic> initialScopedUpdate = std::nullopt);
    void unlinkShadowNodeWithUnistyles(const ShadowNodeFamily*);
    void suspendShadowNode(const ShadowNodeFamily*);
    bool isSuspended(const ShadowNodeFamily*) const noexcept;
    std::shared_ptr<core::StyleSheet> addStyleSheet(jsi::Runtime& rt, uint64_t generation, core::StyleSheetType type, jsi::Object&& rawValue);
    DependencyMap buildDependencyMap(std::vector<UnistyleDependency>& deps);
    void shadowLeafUpdateFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Value& maybePressableId);
    // call it only within trafficController.withLock!
    void queueShadowLeafUpdatesUnsafe(shadow::ShadowLeafUpdates& updates);
    shadow::ShadowTrafficController trafficController{};
    const std::optional<std::string> getScopedTheme();
    void removeDuplicatedUnistyles(const ShadowNodeFamily* shadowNodeFamily, std::vector<core::Unistyle::Shared>& unistyles);
    void setScopedTheme(std::optional<std::string> themeName);
    core::Unistyle::Shared getUnistyleById(std::string unistyleID);
    std::vector<LinkedFamilySnapshot> getLinkedFamiliesSnapshot();
    size_t getPendingUpdatesCount();
    void setCommittedTags(std::vector<Tag>&& tags);
    std::vector<Tag> takeCommittedTags();

    // newest installed runtime owns the registry, generation 0 means no owner
    // previous runtime's state is kept aside until it releases ownership, as it may still run JS
    uint64_t takeOwnership();
    void releaseOwnership(uint64_t generation);

    inline bool isCurrent(uint64_t generation) const noexcept {
        return generation != 0 && generation == this->_generation.load();
    }

private:
    using ReleasedFamilies = std::vector<std::shared_ptr<const ShadowNodeFamily>>;

    struct OwnedState {
        std::unordered_map<const ShadowNodeFamily*, LinkedFamily> shadowRegistry;
        shadow::PinnedShadowLeafUpdates updates;
        std::unordered_map<int, std::shared_ptr<core::StyleSheet>> styleSheets;
        std::unique_ptr<UnistylesState> state;
    };

    UnistylesRegistry() = default;

    // call it only within _ownershipMutex!
    // destructs nothing, so it can run on the next runtime's thread
    OwnedState takeOwnedState();

    // call it only within trafficController.withLock!
    // pins are moved to releasedFamilies, so they can be released after unlocking
    void forgetFamilyUnsafe(const ShadowNodeFamily* shadowNodeFamily, ReleasedFamilies& releasedFamilies);
    void sweepUnownedFamiliesUnsafe(ReleasedFamilies& releasedFamilies);

    // React Native doesn't own the family anymore, it was unmounted without unlink
    static bool isOwnedOnlyByUnistyles(const LinkedFamily& linkedFamily) noexcept;

    static constexpr size_t MIN_SWEEP_THRESHOLD = 64;

    // lock order is _ownershipMutex -> trafficController, never call JS within
    std::mutex _ownershipMutex;
    std::atomic<uint64_t> _generation{0};
    uint64_t _lastGeneration = 0;
    std::unordered_map<uint64_t, OwnedState> _replacedStates{};
    static std::atomic<int> _nextStyleSheetTag;
    std::optional<std::string> _scopedTheme{};
    std::unique_ptr<UnistylesState> _state{};
    std::unordered_map<int, std::shared_ptr<core::StyleSheet>> _styleSheetRegistry{};
    std::unordered_map<const ShadowNodeFamily*, LinkedFamily> _shadowRegistry{};
    size_t _sweepThreshold = MIN_SWEEP_THRESHOLD;
    std::vector<Tag> _committedTags{};
};

inline UnistylesRegistry& UnistylesRegistry::get() {
    static UnistylesRegistry cache;

    return cache;
}

}
