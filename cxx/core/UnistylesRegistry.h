#pragma once

#include "set"
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
#include "Dimensions.hpp"

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
    void registerBreakpoints(jsi::Runtime& rt, std::vector<std::pair<std::string, double>>& sortedBreakpoints);
    void setPrefersAdaptiveThemes(jsi::Runtime& rt, bool prefersAdaptiveThemes);
    void setInitialThemeName(jsi::Runtime& rt, std::string themeName);
    void updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback);

    UnistylesState& getState(jsi::Runtime& rt);
    void createState(jsi::Runtime& rt);
    std::vector<std::shared_ptr<core::StyleSheet>> getStyleSheetsToRefresh(jsi::Runtime& rt, std::vector<UnistyleDependency>& unistylesDependencies);
    void linkShadowNodeWithUnistyle(jsi::Runtime& rt, const ShadowNodeFamily*, std::vector<std::shared_ptr<UnistyleData>>& unistylesData);
    void unlinkShadowNodeWithUnistyles(jsi::Runtime& rt, const ShadowNodeFamily*);
    std::shared_ptr<core::StyleSheet> addStyleSheet(jsi::Runtime& rt, int tag, core::StyleSheetType type, jsi::Object&& rawValue);
    DependencyMap buildDependencyMap(jsi::Runtime& rt, std::vector<UnistyleDependency>& deps);
    void shadowLeafUpdateFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Value& maybePressableId);
    shadow::ShadowTrafficController trafficController{};
    const std::optional<std::string> getScopedTheme();
    void removeDuplicatedUnistyles(jsi::Runtime& rt, const ShadowNodeFamily* shadowNodeFamily, std::vector<core::Unistyle::Shared>& unistyles);
    void setScopedTheme(std::optional<std::string> themeName);
    core::Unistyle::Shared getUnistyleById(jsi::Runtime& rt, std::string unistyleID);

    void setScopedContainerBreakpointId(std::optional<int> containerId);
    const std::optional<int> getScopedContainerBreakpointId();
    void setContainerSize(int containerId, Dimensions dimensions);
    std::optional<Dimensions> getContainerSize(int containerId);
    void removeContainerSize(int containerId);
    DependencyMap buildContainerDependencyMap(jsi::Runtime& rt, int containerId);

    void destroy();

private:
    UnistylesRegistry() = default;

    std::optional<std::string> _scopedTheme{};
    std::optional<int> _scopedContainerBreakpointId{};
    std::unordered_map<int, Dimensions> _containerSizes{};
    std::unordered_map<jsi::Runtime*, UnistylesState> _states{};
    std::unordered_map<jsi::Runtime*, std::unordered_map<int, std::shared_ptr<core::StyleSheet>>> _styleSheetRegistry{};
    std::unordered_map<jsi::Runtime*, std::unordered_map<const ShadowNodeFamily*, std::vector<std::shared_ptr<UnistyleData>>>> _shadowRegistry{};
};

inline UnistylesRegistry& UnistylesRegistry::get() {
    static UnistylesRegistry cache;

    return cache;
}

}
