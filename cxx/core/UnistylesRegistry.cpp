#include "UnistylesRegistry.h"
#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;
using namespace facebook::react;

void core::UnistylesRegistry::registerTheme(jsi::Runtime& rt, std::string name, jsi::Object&& theme) {
    auto& state = this->getState(rt);

    state._jsThemes.emplace(name, jsi::WeakObject(rt, std::move(theme)));
    state._registeredThemeNames.push_back(name);
}

void core::UnistylesRegistry::registerBreakpoints(jsi::Runtime& rt, std::vector<std::pair<std::string, double>>& sortedBreakpoints) {
    auto& state = this->getState(rt);

    state._sortedBreakpointPairs = std::move(sortedBreakpoints);
}

void core::UnistylesRegistry::setPrefersAdaptiveThemes(jsi::Runtime& rt, bool prefersAdaptiveThemes) {
    auto& state = this->getState(rt);

    state._prefersAdaptiveThemes = prefersAdaptiveThemes;
}

void core::UnistylesRegistry::setInitialThemeName(jsi::Runtime& rt, std::string themeName) {
    auto& state = this->getState(rt);

    state._initialThemeName = themeName;
}

core::UnistylesState& core::UnistylesRegistry::getState(jsi::Runtime& rt) {
    auto it = this->_states.find(&rt);

    helpers::assertThat(rt, it != this->_states.end(), "Unistyles was loaded, but it's not configured. Did you forget to call StyleSheet.configure? If you don't want to use any themes or breakpoints, simply call it with an empty object {}.");

    return it->second;
}

void core::UnistylesRegistry::createState(jsi::Runtime& rt) {
    auto it = this->_states.find(&rt);

    // remove old state, so we can swap it with new config
    // during live reload
    if (it != this->_states.end()) {
        this->_states.extract(&rt);
    }

    this->_states.emplace(
        std::piecewise_construct,
        std::forward_as_tuple(&rt),
        std::forward_as_tuple(rt)
    );
}

void core::UnistylesRegistry::updateTheme(jsi::Runtime& rt, std::string& themeName, jsi::Function&& callback) {
    auto& state = this->getState(rt);
    auto it = state._jsThemes.find(themeName);

    helpers::assertThat(rt, it != state._jsThemes.end(), "Unistyles: You're trying to update theme '" + themeName + "' but it wasn't registered.");

    auto currentThemeValue = it->second.lock(rt);

    helpers::assertThat(rt, currentThemeValue.isObject(), "Unistyles: Unable to update your theme from C++. It was already garbage collected.");

    auto result = callback.call(rt, currentThemeValue.asObject(rt));

    helpers::assertThat(rt, result.isObject(), "Unistyles: Returned theme is not an object. Please check your updateTheme function.");

    it->second = jsi::WeakObject(rt, result.asObject(rt));
}

void core::UnistylesRegistry::linkShadowNodeWithUnistyle(
    jsi::Runtime& rt,
    const ShadowNodeFamily* shadowNodeFamily,
    std::vector<core::Unistyle::Shared>& unistyles,
    Variants& variants,
    std::vector<folly::dynamic>& arguments
) {
    if (!this->_shadowRegistry[&rt].contains(shadowNodeFamily)) {
        this->_shadowRegistry[&rt][shadowNodeFamily] = {};
    }

    std::for_each(unistyles.begin(), unistyles.end(), [&, this](Unistyle::Shared unistyle){
        this->_shadowRegistry[&rt][shadowNodeFamily].emplace_back(std::make_shared<UnistyleData>(unistyle, variants, arguments));
    });
}

void core::UnistylesRegistry::unlinkShadowNodeWithUnistyles(jsi::Runtime& rt, const ShadowNodeFamily* shadowNodeFamily) {
    this->_shadowRegistry[&rt][shadowNodeFamily].clear();
}

core::Unistyle::Shared core::UnistylesRegistry::findUnistyleFromKey(jsi::Runtime& rt, std::string styleKey, int tag) {
    auto targetStyleSheet = this->_styleSheetRegistry[&rt][tag];
    
    if (targetStyleSheet == nullptr) {
        return nullptr;
    }
    
    return targetStyleSheet.get()->unistyles[styleKey];
}

std::shared_ptr<core::StyleSheet> core::UnistylesRegistry::addStyleSheet(jsi::Runtime& rt, int unid, core::StyleSheetType type, jsi::Object&& rawValue) {
    this->_styleSheetRegistry[&rt][unid] = std::make_shared<core::StyleSheet>(unid, type, std::move(rawValue));

    return this->_styleSheetRegistry[&rt][unid];
}

core::DependencyMap core::UnistylesRegistry::buildDependencyMap(jsi::Runtime& rt, std::vector<UnistyleDependency>& deps) {
    DependencyMap dependencyMap;
    std::set<UnistyleDependency> uniqueDependencies(deps.begin(), deps.end());

    for (const auto& [family, unistyles] : this->_shadowRegistry[&rt]) {
        for (const auto& unistyleData : unistyles) {
            bool hasAnyOfDependencies = std::any_of(
                unistyleData->unistyle->dependencies.begin(),
                unistyleData->unistyle->dependencies.end(),
                [&uniqueDependencies](UnistyleDependency dep) {
                    return std::find(uniqueDependencies.begin(), uniqueDependencies.end(), dep) != uniqueDependencies.end();
                }
            );

            if (!hasAnyOfDependencies) {
                continue;
            }

            // we need to take in count all unistyles from the shadowNode
            // as user might be using spreads and not all of them may have dependencies
            for (const auto& unistyleData : unistyles) {
                dependencyMap[family].emplace_back(unistyleData);
            }

            break;
        }
    }

    return dependencyMap;
}

core::DependencyMap core::UnistylesRegistry::buildDependencyMap(jsi::Runtime& rt) {
    DependencyMap dependencyMap;

    for (const auto& [family, unistyles] : this->_shadowRegistry[&rt]) {
        for (const auto& unistyleData : unistyles) {
            dependencyMap[family].emplace_back(unistyleData);
        }
    }

    return dependencyMap;
}
