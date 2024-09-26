#include "UnistylesRegistry.h"
#include "UnistylesState.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;
using namespace facebook::react;

using DependencyMap = std::unordered_map<
    std::shared_ptr<core::StyleSheet>,
    std::unordered_map<const ShadowNodeFamily*, std::vector<core::Unistyle::Shared>>
>;

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
    
    helpers::assertThat(rt, it != state._jsThemes.end(), "you're trying to update theme '" + themeName + "' but it wasn't registered.");
    
    auto currentThemeValue = it->second.lock(rt);
    
    helpers::assertThat(rt, currentThemeValue.isObject(), "unable to update your theme from C++. It was already garbage collected.");
    
    auto result = callback.call(rt, currentThemeValue.asObject(rt));
    
    helpers::assertThat(rt, result.isObject(), "returned theme is not an object. Please check your updateTheme function.");

    it->second = jsi::WeakObject(rt, result.asObject(rt));
}

void core::UnistylesRegistry::linkShadowNodeWithUnistyle(const ShadowNodeFamily* shadowNodeFamily, const core::Unistyle::Shared unistyle) {
    if (!this->_shadowRegistry.contains(shadowNodeFamily)) {
        this->_shadowRegistry[shadowNodeFamily] = {};
    }
    
    this->_shadowRegistry[shadowNodeFamily].emplace_back(unistyle);
}

void core::UnistylesRegistry::unlinkShadowNodeWithUnistyle(const ShadowNodeFamily* shadowNodeFamily, const core::Unistyle::Shared unistyle) {
    auto& unistylesVec = this->_shadowRegistry[shadowNodeFamily];
    auto it = std::find(unistylesVec.begin(), unistylesVec.end(), unistyle);
    
    if (it != unistylesVec.end()) {
        this->_shadowRegistry[shadowNodeFamily].erase(it);
    }
}

std::shared_ptr<core::StyleSheet> core::UnistylesRegistry::addStyleSheet(int tag, core::StyleSheetType type, jsi::Object&& rawValue) {
    this->_styleSheetRegistry.emplace_back(std::make_shared<core::StyleSheet>(tag, type, std::move(rawValue)));

    return this->_styleSheetRegistry.back();
}

void core::UnistylesRegistry::removeStyleSheet(int tag) {
    auto it = std::find_if(
        this->_styleSheetRegistry.begin(),
        this->_styleSheetRegistry.end(),
        [tag](std::shared_ptr<StyleSheet> styleSheet){
            return styleSheet->tag == tag;
        }
    );

    if (it == this->_styleSheetRegistry.cend()) {
        throw std::runtime_error("stylesheet with tag: " + std::to_string(tag) + " cannot be found.");
    }

    this->_styleSheetRegistry.erase(it);
}
    
DependencyMap core::UnistylesRegistry::buildDependencyMap(std::vector<UnistyleDependency>& deps) {
    DependencyMap dependencyMap;
 
    for (const auto& styleSheet : this->_styleSheetRegistry) {
        for (const auto& [_, unistyle] : styleSheet->unistyles) {
            // check if in the given stylesheet we have unistyle
            // that depends on something affected
            bool hasAnyOfDependencies = std::any_of(
                unistyle->dependencies.begin(),
                unistyle->dependencies.end(),
                [&deps](UnistyleDependency dep) {
                    return std::find(deps.begin(), deps.end(), dep) != deps.end();
                }
            );
            
            if (!hasAnyOfDependencies) {
                continue;
            }
            
            // if so, we need to find shadow family too
            for (const auto& pair : this->_shadowRegistry) {
                const auto& [family, unistyles] = pair;
                
                for (const auto& shadowUnistyle : unistyles) {
                    if (unistyle != shadowUnistyle) {
                        continue;
                    }

                    dependencyMap[styleSheet][family].push_back(shadowUnistyle);
                }
            }
        }
    }

    return dependencyMap;
}
