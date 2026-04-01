#pragma once

#include "set"
#include <atomic>
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
    void linkShadowNodeWithUnistyle(jsi::Runtime& rt, const ShadowNodeFamily*, std::vector<std::shared_ptr<UnistyleData>>& unistylesData);
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

private:
    UnistylesRegistry() = default;

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
