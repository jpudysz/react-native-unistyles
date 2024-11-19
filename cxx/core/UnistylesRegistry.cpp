#include "UnistylesRegistry.h"
#include "UnistylesState.h"
#include "Parser.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;
using namespace facebook::react;

void core::UnistylesRegistry::registerTheme(jsi::Runtime& rt, std::string name, jsi::Value& theme) {
    auto& state = this->getState(rt);

    state._jsThemes.emplace(name, std::move(theme));
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

    auto result = callback.call(rt, it->second);

    helpers::assertThat(rt, result.isObject(), "Unistyles: Returned theme is not an object. Please check your updateTheme function.");

    it->second = result.asObject(rt);
}

void core::UnistylesRegistry::linkShadowNodeWithUnistyle(
    jsi::Runtime& rt,
    const ShadowNodeFamily* shadowNodeFamily,
    std::vector<core::Unistyle::Shared>& unistyles,
    Variants& variants,
    std::vector<std::vector<folly::dynamic>>& arguments
) {
    auto parser = parser::Parser(nullptr);
    shadow::ShadowLeafUpdates updates;
    
    for (size_t index = 0; index < unistyles.size(); index++) {
        Unistyle::Shared unistyle = unistyles[index];

        this->_shadowRegistry[&rt][shadowNodeFamily].emplace_back(std::make_shared<UnistyleData>(unistyle, variants, arguments[index]));

        // add or update node for shadow leaf updates
        // dynamic functions are parsed later
        if (unistyle->type == UnistyleType::Object) {
            for (const auto& [family, unistyles] : this->_shadowRegistry[&rt]) {
                for (const auto& unistyleData : unistyles) {
                    if (unistyleData->unistyle == unistyle && family == shadowNodeFamily) {
                        updates[family] = parser.parseStylesToShadowTreeStyles(rt, {unistyleData});
                    }
                }
            }
        }
    }

    this->trafficController.setUpdates(updates);
    this->trafficController.resumeUnistylesTraffic();
}

void core::UnistylesRegistry::unlinkShadowNodeWithUnistyles(jsi::Runtime& rt, const ShadowNodeFamily* shadowNodeFamily) {
    this->_shadowRegistry[&rt].erase(shadowNodeFamily);
    this->trafficController.removeShadowNode(shadowNodeFamily);

    if (this->_shadowRegistry[&rt].empty()) {
        this->_shadowRegistry.erase(&rt);
    }
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

// called from proxied function only, we don't know host
// so we need to rebuild all instances as they may have different variants
void core::UnistylesRegistry::shadowLeafUpdateFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle) {
    shadow::ShadowLeafUpdates updates;
    auto parser = parser::Parser(nullptr);

    for (const auto& [family, unistyles] : this->_shadowRegistry[&rt]) {
        for (const auto& unistyleData : unistyles) {
            if (unistyleData->unistyle == unistyle) {
                // update state eg. for pressable
                unistyleData->parsedStyle = jsi::Value(rt, unistyle->parsedStyle.value()).asObject(rt);
                updates[family] = parser.parseStylesToShadowTreeStyles(rt, { unistyleData });
            }
        }
    }

    this->trafficController.setUpdates(updates);
}

std::vector<std::shared_ptr<core::StyleSheet>> core::UnistylesRegistry::getStyleSheetsToRefresh(jsi::Runtime& rt, std::vector<UnistyleDependency>& unistylesDependencies) {
    std::vector<std::shared_ptr<core::StyleSheet>> stylesheetsToRefresh{};
    auto themeDidChangeIt = std::find(unistylesDependencies.begin(),
                                      unistylesDependencies.end(),
                                      UnistyleDependency::THEME);
    auto themeDidChange = themeDidChangeIt != unistylesDependencies.end();
    auto runtimeDidChange = (themeDidChange && unistylesDependencies.size() > 1) || unistylesDependencies.size() > 0;
    
    // if nothing changed, skip further lookup
    if (!themeDidChange && !runtimeDidChange) {
        return stylesheetsToRefresh;
    }

    auto& styleSheets = this->_styleSheetRegistry[&rt];

    std::for_each(styleSheets.begin(), styleSheets.end(), [&](std::pair<int, std::shared_ptr<core::StyleSheet>> pair){
        auto& [_, styleSheet] = pair;

        if (styleSheet->type == StyleSheetType::ThemableWithMiniRuntime) {
            for (const auto& unistylePair: styleSheet->unistyles) {
                auto& [_, unistyle] = unistylePair;
                
                bool hasAnyOfDependencies = std::any_of(
                    unistyle->dependencies.begin(),
                    unistyle->dependencies.end(),
                    [&unistylesDependencies](UnistyleDependency dep) {
                        return std::find(unistylesDependencies.begin(), unistylesDependencies.end(), dep) != unistylesDependencies.end();
                    }
                );
                
                if (hasAnyOfDependencies) {
                    stylesheetsToRefresh.emplace_back(styleSheet);
                    
                    return;
                }
            }
        }

        if (styleSheet->type == StyleSheetType::Themable && themeDidChange) {
            stylesheetsToRefresh.emplace_back(styleSheet);
        }
    });

    return stylesheetsToRefresh;
}
