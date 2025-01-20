#include "HybridStyleSheet.h"

using namespace facebook::react;

double HybridStyleSheet::getHairlineWidth() {
    auto pixelRatio = this->_unistylesRuntime->getPixelRatio();
    auto nearestPixel = static_cast<int>(std::trunc(pixelRatio * 0.4));

    return nearestPixel / pixelRatio;
}

double HybridStyleSheet::getUnid() {
    return this->__unid;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime& rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    if (count == 1) {
        helpers::assertThat(rt, false, "Unistyles is not initialized correctly. Please add babel plugin to your babel config.");
    }

    // second argument is hidden, so validation is perfectly fine
    helpers::assertThat(rt, count == 2, "StyleSheet.create expected to be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.create expected to be called with object or function.");

    auto thisStyleSheet = thisVal.asObject(rt);
    auto& registry = core::UnistylesRegistry::get();
    int unid = arguments[1].asNumber();

    jsi::Object rawStyleSheet = arguments[0].asObject(rt);
    auto registeredStyleSheet = registry.addStyleSheetFromValue(rt, std::move(rawStyleSheet), unid);

    this->__unid = registeredStyleSheet->tag;

    auto parser = parser::Parser(this->_unistylesRuntime);

    parser.buildUnistyles(rt, registeredStyleSheet);
    parser.parseUnistyles(rt, registeredStyleSheet);

    return core::toRNStyle(rt, registeredStyleSheet, this->_unistylesRuntime, {});
}

jsi::Value HybridStyleSheet::configure(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, count == 1, "StyleSheet.configure expected to be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.configure expected to be called with object.");

    auto config = arguments[0].asObject(rt);

    helpers::enumerateJSIObject(rt, config, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "settings") {
            helpers::assertThat(rt, propertyValue.isObject(), "StyleSheet.configure's settings must be an object.");

            return this->parseSettings(rt, propertyValue.asObject(rt));
        }

        if (propertyName == "breakpoints") {
            helpers::assertThat(rt, propertyValue.isObject(), "StyleSheet.configure's breakpoints must be an object.");

            return this->parseBreakpoints(rt, propertyValue.asObject(rt));
        }

        if (propertyName == "themes") {
            helpers::assertThat(rt, propertyValue.isObject(), "StyleSheet.configure's themes must be an object.");

            return this->parseThemes(rt, propertyValue.asObject(rt));
        }

        helpers::assertThat(rt, false, "StyleSheet.configure received unexpected key: '" + std::string(propertyName) + "'.");
    });

    verifyAndSelectTheme(rt);

    auto& state = core::UnistylesRegistry::get().getState(rt);

    state.hasUserConfig = true;

    return jsi::Value::undefined();
}

jsi::Value HybridStyleSheet::init(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    if (this->isInitialized) {
        return jsi::Value::undefined();
    }
    
    // create new state
    auto& registry = core::UnistylesRegistry::get();

    registry.createState(rt);

    loadExternalMethods(thisVal, rt);
    registerHooks(rt);
    
    this->isInitialized = true;

    return jsi::Value::undefined();
}

void HybridStyleSheet::parseSettings(jsi::Runtime &rt, jsi::Object settings) {
    auto& registry = core::UnistylesRegistry::get();

    helpers::enumerateJSIObject(rt, settings, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "adaptiveThemes") {
            helpers::assertThat(rt, propertyValue.isBool(), "StyleSheet.configure's adaptiveThemes must be of boolean type.");

            registry.setPrefersAdaptiveThemes(rt, propertyValue.asBool());

            return;
        }

        if (propertyName == "initialTheme") {
            if (propertyValue.isObject()) {
                helpers::assertThat(rt, propertyValue.asObject(rt).isFunction(rt), "StyleSheet.configure's initialTheme must be either a string or a function.");

                auto result = propertyValue.asObject(rt).asFunction(rt).call(rt);

                helpers::assertThat(rt, result.isString(), "StyleSheet.configure's initialTheme resolved from function is not a string. Please check your initialTheme function.");

                return registry.setInitialThemeName(rt, result.asString(rt).utf8(rt));
            }

            helpers::assertThat(rt, propertyValue.isString(), "StyleSheet.configure's initialTheme must be either a string or a function.");

            registry.setInitialThemeName(rt, propertyValue.asString(rt).utf8(rt));

            return;
        }

        if (propertyName == "CSSVars") {
            return;
        }

        helpers::assertThat(rt, false, "StyleSheet.configure's settings received unexpected key: '" + std::string(propertyName) + "'");
    });
}

void HybridStyleSheet::parseBreakpoints(jsi::Runtime &rt, jsi::Object breakpoints){
    helpers::Breakpoints sortedBreakpoints = helpers::jsiBreakpointsToVecPairs(rt, std::move(breakpoints));

    helpers::assertThat(rt, !sortedBreakpoints.empty(), "StyleSheet.configure's breakpoints can't be empty.");
    helpers::assertThat(rt, sortedBreakpoints.front().second == 0, "StyleSheet.configure's first breakpoint must start from 0.");

    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);

    registry.registerBreakpoints(rt, sortedBreakpoints);
    state.computeCurrentBreakpoint(this->_unistylesRuntime->getScreen().width);
}

void HybridStyleSheet::parseThemes(jsi::Runtime &rt, jsi::Object themes) {
    auto& registry = core::UnistylesRegistry::get();

    helpers::enumerateJSIObject(rt, themes, [&](const std::string& propertyName, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "StyleSheet.configure's registered theme '" + propertyName + "' must be an object.");

        registry.registerTheme(rt, propertyName, propertyValue);
    });
}

void HybridStyleSheet::verifyAndSelectTheme(jsi::Runtime &rt) {
    auto& state = core::UnistylesRegistry::get().getState(rt);

    bool hasInitialTheme = state.hasInitialTheme();
    bool prefersAdaptiveThemes = state.getPrefersAdaptiveThemes();
    bool hasAdaptiveThemes = state.hasAdaptiveThemes();
    std::vector<std::string> registeredThemeNames = state.getRegisteredThemeNames();
    bool hasSingleTheme = registeredThemeNames.size() == 1;

    // user tries to enable adaptive themes, but didn't register both 'light' and 'dark' themes
    if (prefersAdaptiveThemes && !hasAdaptiveThemes) {
        helpers::assertThat(rt, false, "Unistyles: You're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes.");
    }

    // user didn't select initial theme nor can have adaptive themes, and registered more than 1 theme
    // do nothing - user must select initial theme during runtime
    if (!hasInitialTheme && !hasAdaptiveThemes && !hasSingleTheme) {
        return;
    }

    // user didn't select initial theme nor can have adaptive themes, but registered exactly 1 theme
    // preselect it!
    if (!hasInitialTheme && !hasAdaptiveThemes && hasSingleTheme) {
        return state.setTheme(registeredThemeNames.at(0));
    }

    // user didn't select initial theme, but has adaptive themes
    // simply select theme based on color scheme
    if (!hasInitialTheme && hasAdaptiveThemes) {
        return this->setThemeFromColorScheme(rt);
    }

    // user selected both initial theme and adaptive themes
    // we should throw an error as these options are mutually exclusive
    if (hasInitialTheme && hasAdaptiveThemes) {
        helpers::assertThat(rt, false, "Unistyles: You're trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.");
    }

    // user only selected initial theme
    // validate if following theme exist
    std::string selectedTheme = state.getInitialTheme().value();

    helpers::assertThat(rt, state.hasTheme(selectedTheme), "Unistyles: You're trying to select theme '" + selectedTheme + "' but it wasn't registered.");

    state.setTheme(selectedTheme);
}

void HybridStyleSheet::setThemeFromColorScheme(jsi::Runtime& rt) {
    auto& state = core::UnistylesRegistry::get().getState(rt);
    auto colorScheme = static_cast<ColorScheme>(this->_unistylesRuntime->getColorScheme());

    switch (colorScheme) {
        case ColorScheme::LIGHT:
            state.setTheme("light");

            return;
        case ColorScheme::DARK:
            state.setTheme("dark");

            return;
        default:
            throw std::runtime_error("Unistyles: Unable to set adaptive theme as your device doesn't support it.");
    }
}

void HybridStyleSheet::loadExternalMethods(const jsi::Value& thisValue, jsi::Runtime& rt) {
    auto jsMethods = thisValue.getObject(rt).getProperty(rt, "jsMethods");

    helpers::assertThat(rt, jsMethods.isObject(), "Unistyles: Can't find jsMethods.");

    auto maybeProcessColorFn = jsMethods.asObject(rt).getProperty(rt, "processColor");

    helpers::assertThat(rt, maybeProcessColorFn.isObject(), "Unistyles: Can't load processColor function from JS.");

    auto processColorFn = maybeProcessColorFn.asObject(rt).asFunction(rt);
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);

    state.registerProcessColorFunction(std::move(processColorFn));
}

void HybridStyleSheet::registerHooks(jsi::Runtime& rt) {
    // cleanup Shadow updates
    core::UnistylesRegistry::get().trafficController.restore();

    this->_unistylesCommitHook = std::make_shared<core::UnistylesCommitHook>(this->_uiManager);
    this->_unistylesMountHook = std::make_shared<core::UnistylesMountHook>(this->_uiManager, this->_unistylesRuntime);
}

void HybridStyleSheet::onPlatformDependenciesChange(std::vector<UnistyleDependency> dependencies) {
    // this event listener is triggered from C++ module, and it's only about theme / adaptive theme changes
    if (dependencies.size() == 0) {
        return;
    }

    auto& registry = core::UnistylesRegistry::get();
    auto& rt = this->_unistylesRuntime->getRuntime();
    auto parser = parser::Parser(this->_unistylesRuntime);
    auto dependencyMap = registry.buildDependencyMap(rt, dependencies);

    if (dependencyMap.empty()) {
        this->notifyJSListeners(dependencies);
    }

    // in a later step, we will rebuild only Unistyles with mounted StyleSheets
    // however, user may have StyleSheets with components that haven't mounted yet
    // we need to rebuild all dependent StyleSheets as well
    auto dependentStyleSheets = registry.getStyleSheetsToRefresh(rt, dependencies);

    parser.rebuildUnistylesInDependencyMap(rt, dependencyMap, dependentStyleSheets, std::nullopt);

    // we need to stop here if there is nothing to update at the moment,
    // but we need to compute dependentStyleSheets
    if (dependencyMap.empty()) {
        return;
    }

    parser.rebuildShadowLeafUpdates(rt, dependencyMap);

    this->notifyJSListeners(dependencies);
    shadow::ShadowTreeManager::updateShadowTree(UIManagerBinding::getBinding(rt)->getUIManager().getShadowTreeRegistry());
}

void HybridStyleSheet::onPlatformNativeDependenciesChange(std::vector<UnistyleDependency> dependencies, UnistylesNativeMiniRuntime miniRuntime) {
    // this event listener is triggered from Native platform
    if (dependencies.size() == 0 || this->_unistylesRuntime == nullptr) {
        return;
    }

    this->_unistylesRuntime->runOnJSThread([this, dependencies, miniRuntime](jsi::Runtime& rt){
        auto& registry = core::UnistylesRegistry::get();
        auto parser = parser::Parser(this->_unistylesRuntime);
        auto unistyleDependencies = std::move(dependencies);

        // re-compute new breakpoint
        auto dimensionsIt = std::find(dependencies.begin(), dependencies.end(), UnistyleDependency::DIMENSIONS);

        if (dimensionsIt != dependencies.end()) {
            registry.getState(rt).computeCurrentBreakpoint(this->_unistylesRuntime->getScreen().width);
        }

        // check if color scheme changed and then if Unistyles state depend on it (adaptive themes)
        auto colorSchemeIt = std::find(dependencies.begin(), dependencies.end(), UnistyleDependency::COLORSCHEME);
        auto hasNewColorScheme = colorSchemeIt != dependencies.end();

        if (hasNewColorScheme) {
            this->_unistylesRuntime->includeDependenciesForColorSchemeChange(unistyleDependencies);
        }

        auto dependencyMap = registry.buildDependencyMap(rt, unistyleDependencies);

        if (dependencyMap.empty()) {
            this->notifyJSListeners(unistyleDependencies);
        }

        // in a later step, we will rebuild only Unistyles with mounted StyleSheets
        // however, user may have StyleSheets with components that haven't mounted yet
        // we need to rebuild all dependent StyleSheets as well
        auto dependentStyleSheets = registry.getStyleSheetsToRefresh(rt, unistyleDependencies);

        parser.rebuildUnistylesInDependencyMap(rt, dependencyMap, dependentStyleSheets, miniRuntime);

        // we need to stop here if there is nothing to update at the moment,
        // but we need to compute dependentStyleSheets
        if (dependencyMap.empty()) {
            return;
        }

        parser.rebuildShadowLeafUpdates(rt, dependencyMap);

        this->notifyJSListeners(unistyleDependencies);
        shadow::ShadowTreeManager::updateShadowTree(UIManagerBinding::getBinding(rt)->getUIManager().getShadowTreeRegistry());
    });
}

void HybridStyleSheet::onImeChange(UnistylesNativeMiniRuntime miniRuntime) {
    if (this->_unistylesRuntime == nullptr) {
        return;
    }

    this->_unistylesRuntime->runOnJSThread([this, miniRuntime](jsi::Runtime& rt){
        std::vector<UnistyleDependency> dependencies{UnistyleDependency::IME};
        auto& registry = core::UnistylesRegistry::get();
        auto parser = parser::Parser(this->_unistylesRuntime);
        auto dependencyMap = registry.buildDependencyMap(rt, dependencies);

        if (dependencyMap.empty()) {
            this->notifyJSListeners(dependencies);

            return;
        }

        // we don't care about other unmounted stylesheets as their not visible
        // so user won't see any changes
        std::vector<std::shared_ptr<core::StyleSheet>> dependentStyleSheets;

        parser.rebuildUnistylesInDependencyMap(rt, dependencyMap, dependentStyleSheets, miniRuntime);
        parser.rebuildShadowLeafUpdates(rt, dependencyMap);

        this->notifyJSListeners(dependencies);
        shadow::ShadowTreeManager::updateShadowTree(UIManagerBinding::getBinding(rt)->getUIManager().getShadowTreeRegistry());
    });
}

void HybridStyleSheet::notifyJSListeners(std::vector<UnistyleDependency>& dependencies) {
    if (!dependencies.empty()) {
        std::for_each(this->_changeListeners.begin(), this->_changeListeners.end(), [&](auto& listener){
            (*listener)(dependencies);
        });
    }
}

std::function<void ()> HybridStyleSheet::addChangeListener(const std::function<void (const std::vector<UnistyleDependency>&)>& onChanged) {
    auto listener = std::make_unique<std::function<void(std::vector<UnistyleDependency>&)>>(onChanged);

    this->_changeListeners.push_back(std::move(listener));

    return [this, listenerPtr = this->_changeListeners.back().get()](){
        auto it = std::find_if(this->_changeListeners.begin(), this->_changeListeners.end(), [listenerPtr](auto& ptr) {
            return ptr.get() == listenerPtr;
        });

        if (it != this->_changeListeners.end()) {
            this->_changeListeners.erase(it);
        }
    };
}
