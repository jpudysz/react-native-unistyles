#include "HybridStyleSheet.h"

using namespace facebook::react;

double HybridStyleSheet::getHairlineWidth() {
    double pixelRatio = this->_unistylesRuntime->getPixelRatio();
    double hairlineWidth = std::round(pixelRatio * 0.4) / pixelRatio;

    if (hairlineWidth == 0.0) {
        hairlineWidth = 1.0 / pixelRatio;
    }

    return hairlineWidth;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime& rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, count == 1, "StyleSheet.create expected to be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.create expected to be called with object or function.");

    auto thisStyleSheet = thisVal.asObject(rt);
    auto& registry = core::UnistylesRegistry::get();

    jsi::Object rawStyleSheet = arguments[0].asObject(rt);
    auto registeredStyleSheet = registry.addStyleSheetFromValue(rt, std::move(rawStyleSheet));

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

    auto& state = core::UnistylesRegistry::get().getState();

    state.hasUserConfig = true;

    return jsi::Value::undefined();
}

jsi::Value HybridStyleSheet::init(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    if (this->isInitialized) {
        return jsi::Value::undefined();
    }

    // create new state
    auto& registry = core::UnistylesRegistry::get();

    registry.createState();

    loadExternalMethods(thisVal, rt);

    this->isInitialized = true;

    return jsi::Value::undefined();
}

void HybridStyleSheet::parseSettings(jsi::Runtime &rt, jsi::Object settings) {
    auto& registry = core::UnistylesRegistry::get();

    // set defafults
    registry.shouldUsePointsForBreakpoints = false;

    helpers::enumerateJSIObject(rt, settings, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "adaptiveThemes") {
            helpers::assertThat(rt, propertyValue.isBool(), "StyleSheet.configure's adaptiveThemes must be of boolean type.");

            registry.setPrefersAdaptiveThemes(propertyValue.asBool());

            return;
        }

        if (propertyName == "initialTheme") {
            if (propertyValue.isObject()) {
                helpers::assertThat(rt, propertyValue.asObject(rt).isFunction(rt), "StyleSheet.configure's initialTheme must be either a string or a function.");

                auto result = propertyValue.asObject(rt).asFunction(rt).call(rt);

                helpers::assertThat(rt, result.isString(), "StyleSheet.configure's initialTheme resolved from function is not a string. Please check your initialTheme function.");

                return registry.setInitialThemeName(result.asString(rt).utf8(rt));
            }

            helpers::assertThat(rt, propertyValue.isString(), "StyleSheet.configure's initialTheme must be either a string or a function.");

            registry.setInitialThemeName(propertyValue.asString(rt).utf8(rt));

            return;
        }

        if (propertyName == "CSSVars") {
            return;
        }

        if (propertyName == "nativeBreakpointsMode") {
            helpers::assertThat(rt, propertyValue.isString(), "StyleSheet.configure's nativeBreakpointsMode must be a string");

            auto mode = propertyValue.asString(rt).utf8(rt);

            helpers::assertThat(rt, mode == "pixels" || mode == "points", "StyleSheet.configure's nativeBreakpointsMode must be one of: pixels or points");

            if (mode == "points") {
                registry.shouldUsePointsForBreakpoints = true;
            }

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
    auto& state = registry.getState();

    registry.registerBreakpoints(sortedBreakpoints);

    auto rawWidth = this->_unistylesRuntime->getScreen().width;
    auto width = registry.shouldUsePointsForBreakpoints
        ? rawWidth / this->_unistylesRuntime->getPixelRatio()
        : rawWidth;

    state.computeCurrentBreakpoint(width);
}

void HybridStyleSheet::parseThemes(jsi::Runtime &rt, jsi::Object themes) {
    auto& registry = core::UnistylesRegistry::get();

    helpers::enumerateJSIObject(rt, themes, [&](const std::string& propertyName, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "StyleSheet.configure's registered theme '" + propertyName + "' must be an object.");

        registry.registerTheme(rt, propertyName, propertyValue);
    });
}

void HybridStyleSheet::verifyAndSelectTheme(jsi::Runtime &rt) {
    auto& state = core::UnistylesRegistry::get().getState();

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
    auto& state = core::UnistylesRegistry::get().getState();
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

    auto maybeParseBoxShadowStringFn = jsMethods.asObject(rt).getProperty(rt, "parseBoxShadowString");

    helpers::assertThat(rt, maybeParseBoxShadowStringFn.isObject(), "Unistyles: Can't load parseBoxShadowString function from JS.");

    auto processColorFn = maybeProcessColorFn.asObject(rt).asFunction(rt);
    auto parseBoxShadowStringFn = maybeParseBoxShadowStringFn.asObject(rt).asFunction(rt);
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState();

    state.registerProcessColorFunction(std::move(processColorFn));
    state.registerParseBoxShadowString(std::move(parseBoxShadowStringFn));
}

void HybridStyleSheet::onPlatformDependenciesChange(std::vector<UnistyleDependency> dependencies) {
    // this event listener is triggered from C++ module, and it's only about theme / adaptive theme changes
    if (dependencies.size() == 0) {
        return;
    }

    auto weakSelf = weak_from_this();

    this->_unistylesRuntime->runOnJSThread([weakSelf, dependencies](jsi::Runtime& rt) {
        auto self = std::dynamic_pointer_cast<HybridStyleSheet>(weakSelf.lock());

        if (!self) {
            return;
        }

        auto unistyleDependencies = dependencies;

        self->applyDependencyChanges(rt, unistyleDependencies, std::nullopt);
    });
}

void HybridStyleSheet::onPlatformNativeDependenciesChange(std::vector<UnistyleDependency> dependencies, UnistylesNativeMiniRuntime miniRuntime) {
    // this event listener is triggered from Native platform
    if (dependencies.size() == 0 || this->_unistylesRuntime == nullptr) {
        return;
    }

    auto weakSelf = weak_from_this();

    this->_unistylesRuntime->runOnJSThread([weakSelf, dependencies, miniRuntime](jsi::Runtime& rt){
        auto self = std::dynamic_pointer_cast<HybridStyleSheet>(weakSelf.lock());

        if (!self) {
            return;
        }

        auto& registry = core::UnistylesRegistry::get();
        auto unistyleDependencies = std::move(dependencies);

        // re-compute new breakpoint
        auto dimensionsIt = std::find(dependencies.begin(), dependencies.end(), UnistyleDependency::DIMENSIONS);

        if (dimensionsIt != dependencies.end()) {
            auto rawWidth = self->_unistylesRuntime->getScreen().width;
            auto width = registry.shouldUsePointsForBreakpoints
                ? rawWidth / self->_unistylesRuntime->getPixelRatio()
                : rawWidth;

            registry.getState().computeCurrentBreakpoint(width);
        }

        // check if color scheme changed and then if Unistyles state depend on it (adaptive themes)
        auto colorSchemeIt = std::find(dependencies.begin(), dependencies.end(), UnistyleDependency::COLORSCHEME);
        auto hasNewColorScheme = colorSchemeIt != dependencies.end();

        if (hasNewColorScheme) {
            self->_unistylesRuntime->includeDependenciesForColorSchemeChange(unistyleDependencies);
        }

        self->applyDependencyChanges(rt, unistyleDependencies, miniRuntime);
    });
}

void HybridStyleSheet::onImeChange(UnistylesNativeMiniRuntime miniRuntime) {
    if (this->_unistylesRuntime == nullptr) {
        return;
    }

    auto weakSelf = weak_from_this();

    this->_unistylesRuntime->runOnJSThread([weakSelf, miniRuntime](jsi::Runtime& rt){
        auto self = std::dynamic_pointer_cast<HybridStyleSheet>(weakSelf.lock());

        if (!self) {
            return;
        }

        std::vector<UnistyleDependency> dependencies{UnistyleDependency::IME};

        self->applyDependencyChanges(rt, dependencies, miniRuntime);
    });
}

void HybridStyleSheet::applyDependencyChanges(jsi::Runtime& rt, std::vector<UnistyleDependency>& dependencies, std::optional<UnistylesNativeMiniRuntime> maybeMiniRuntime) {
    auto& registry = core::UnistylesRegistry::get();
    auto parser = parser::Parser(this->_unistylesRuntime);
    auto dependencyMap = registry.buildDependencyMap(dependencies);

    // include StyleSheets consumed only by JS (withUnistyles) — they aren't in dependencyMap
    // but their rawValue must still be refreshed so rerenders read fresh closures
    auto dependentStyleSheets = registry.getStyleSheetsToRefresh(dependencies);

    if (dependencyMap.empty() && dependentStyleSheets.empty()) {
        return;
    }

    // rebuild rawValue BEFORE notifying listeners so JS rerenders read fresh closures
    parser.rebuildUnistylesInDependencyMap(rt, dependencyMap, dependentStyleSheets, maybeMiniRuntime);

    if (!dependencyMap.empty()) {
        parser.rebuildShadowLeafUpdates(rt, dependencyMap);
    }

    this->notifyJSListeners(dependencies);

    if (!dependencyMap.empty()) {
        shadow::ShadowTreeManager::updateShadowTree(rt);
    }
}

void HybridStyleSheet::notifyJSListeners(std::vector<UnistyleDependency>& dependencies) {
    if (dependencies.empty()) {
        return;
    }

    std::vector<std::function<void(std::vector<UnistyleDependency>&)>> callbacks;
    {
        std::lock_guard<std::mutex> lock(this->_listenersMutex);
        callbacks.reserve(this->_changeListeners.size());

        for (auto& [id, listener] : this->_changeListeners) {
            callbacks.push_back(*listener);
        }
    }

    for (auto& callback : callbacks) {
        callback(dependencies);
    }
}

std::function<void ()> HybridStyleSheet::addChangeListener(const std::function<void (const std::vector<UnistyleDependency>&)>& onChanged) {
    static size_t nextListenerId = 0;

    std::lock_guard<std::mutex> lock(this->_listenersMutex);

    size_t id = nextListenerId++;
    auto listener = std::make_unique<std::function<void(std::vector<UnistyleDependency>&)>>(onChanged);
    this->_changeListeners[id] = std::move(listener);

    return [this, id](){
        std::lock_guard<std::mutex> lock(this->_listenersMutex);
        this->_changeListeners.erase(id);
    };
}
