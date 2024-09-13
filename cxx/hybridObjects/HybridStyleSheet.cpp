#include "HybridStyleSheet.h"

using namespace facebook::react;

double HybridStyleSheet::getHairlineWidth() {
    auto pixelRatio = this->_unistylesRuntime.getPixelRatio();
    auto nearestPixel = static_cast<int>(std::trunc(pixelRatio * 0.4));

    return nearestPixel / pixelRatio;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, arguments[0].isObject(), "expected to be called with object or function.");

    auto thisStyleSheet = thisVal.asObject(rt);
    auto styleSheetId = thisStyleSheet.getProperty(rt, helpers::STYLESHEET_ID.c_str());

    // this might happen only when hot reloading
    if (!styleSheetId.isUndefined()) {
        styleSheetRegistry.remove(styleSheetId.asNumber());
    }

    jsi::Object rawStyleSheet = arguments[0].asObject(rt);
    core::StyleSheet& registeredStyleSheet = styleSheetRegistry.add(rt, std::move(rawStyleSheet));
    auto parsedStyleSheet = styleSheetRegistry.parse(rt, registeredStyleSheet);

    this->attachMetaFunctions(rt, registeredStyleSheet, parsedStyleSheet);

    // attach unique ID
    helpers::defineHiddenProperty(rt, thisStyleSheet, helpers::STYLESHEET_ID, jsi::Value(registeredStyleSheet.tag));

    auto style = std::make_shared<core::HostStyle>(parsedStyleSheet);
    auto styleHostObject = jsi::Object::createFromHostObject(rt, style);

    return styleHostObject;
}

jsi::Value HybridStyleSheet::configure(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, arguments[0].isObject(), "expected to be called with object.");

    // create new state
    auto config = arguments[0].asObject(rt);
    auto& registry = core::UnistylesRegistry::get();
    auto miniRuntime = this->miniRuntime->toObject(rt).asObject(rt);

    registry.createState(rt, miniRuntime);

    helpers::enumerateJSIObject(rt, config, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "settings") {
            helpers::assertThat(rt, propertyValue.isObject(), "settings must be an object.");

            return this->parseSettings(rt, propertyValue.asObject(rt));
        }

        if (propertyName == "breakpoints") {
            helpers::assertThat(rt, propertyValue.isObject(), "breakpoints must be an object.");

            return this->parseBreakpoints(rt, propertyValue.asObject(rt));
        }

        if (propertyName == "themes") {
            helpers::assertThat(rt, propertyValue.isObject(), "themes must be an object.");

            return this->parseThemes(rt, propertyValue.asObject(rt));
        }

        helpers::assertThat(rt, false, "received unexpected key: '" + std::string(propertyName) + "'.");
    });

    verifyAndSelectTheme(rt);

    return jsi::Value::undefined();
}

void HybridStyleSheet::parseSettings(jsi::Runtime &rt, jsi::Object settings) {
    auto& registry = core::UnistylesRegistry::get();

    helpers::enumerateJSIObject(rt, settings, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "adaptiveThemes") {
            helpers::assertThat(rt, propertyValue.isBool(), "adaptiveThemes configuration must be of boolean type.");

            registry.setPrefersAdaptiveThemes(rt, propertyValue.asBool());

            return;
        }

        if (propertyName == "initialTheme") {
            if (propertyValue.isObject()) {
                helpers::assertThat(rt, propertyValue.asObject(rt).isFunction(rt), "initialTheme configuration must be either a string or a function.");

                return registry.setInitialThemeNameCallback(rt, propertyValue.asObject(rt).asFunction(rt));
            }

            helpers::assertThat(rt, propertyValue.isString(), "initialTheme configuration must be either a string or a function.");

            registry.setInitialThemeName(rt, propertyValue.asString(rt).utf8(rt));

            return;
        }

        helpers::assertThat(rt, false, "settings received unexpected key: '" + std::string(propertyName) + "'");
    });
}

void HybridStyleSheet::parseBreakpoints(jsi::Runtime &rt, jsi::Object breakpoints){
    helpers::Breakpoints sortedBreakpoints = helpers::jsiBreakpointsToVecPairs(rt, std::move(breakpoints));

    helpers::assertThat(rt, sortedBreakpoints.size() > 0, "registered breakpoints can't be empty.");
    helpers::assertThat(rt, sortedBreakpoints.front().second == 0, "first breakpoint must start from 0.");

    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);

    registry.registerBreakpoints(rt, sortedBreakpoints);
    state.computeCurrentBreakpoint(nativePlatform.getScreenDimensions().width);
}

void HybridStyleSheet::parseThemes(jsi::Runtime &rt, jsi::Object themes) {
    auto& registry = core::UnistylesRegistry::get();

    helpers::enumerateJSIObject(rt, themes, [&](const std::string& propertyName, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "registered theme '" + propertyName + "' must be an object.");

        registry.registerTheme(rt, propertyName, propertyValue.asObject(rt));
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
        helpers::assertThat(rt, false, "you're trying to enable adaptiveThemes, but you didn't register both 'light' and 'dark' themes.");
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
        helpers::assertThat(rt, false, "you're trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.");
    }

    // user only selected initial theme
    // validate if following theme exist
    std::string selectedTheme = state.getInitialTheme().value();

    helpers::assertThat(rt, state.hasTheme(selectedTheme), "you're trying to select theme '" + selectedTheme + "' but it wasn't registered.");

    state.setTheme(selectedTheme);
}

void HybridStyleSheet::setThemeFromColorScheme(jsi::Runtime& rt) {
    auto& state = core::UnistylesRegistry::get().getState(rt);
    ColorScheme colorScheme = static_cast<ColorScheme>(this->nativePlatform.getColorScheme());

    switch (colorScheme) {
        case ColorScheme::LIGHT:
            state.setTheme("light");

            return;
        case ColorScheme::DARK:
            state.setTheme("dark");

            return;
        default:
            throw std::runtime_error("unable to set adaptive theme as your device doesn't support it.");
    }
}

void HybridStyleSheet::attachMetaFunctions(jsi::Runtime &rt, core::StyleSheet& styleSheet, jsi::Object &parsedStyleSheet) {
    auto addNodeFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_NODE_FN);
    auto removeNodeFnName = jsi::PropNameID::forUtf8(rt, helpers::REMOVE_NODE_FN);
    auto addVariantsFnName = jsi::PropNameID::forUtf8(rt, helpers::ADD_VARIANTS_FN);
    auto addVariantsHostFn = jsi::Function::createFromHostFunction(rt, addVariantsFnName, 1,
        [&](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
        helpers::assertThat(rt, count == 1, "expected to be called with one argument.");
        styleSheet.addVariants(rt, jsi::Value(rt, args[0]));

        jsi::Object stylesWithVariants = jsi::Object(rt);
        auto& state = core::UnistylesRegistry::get().getState(rt);
        auto settings = std::make_unique<parser::ParserSettings>(
            styleSheet.variants,
            state.getCurrentBreakpointName(),
            state.getSortedBreakpointPairs(),
            miniRuntime->getScreen()
        );
        auto& parser = parser::Parser::configure(std::move(settings));

        for (auto& style: styleSheet.unistyles) {
            if (helpers::vecContainsKeys(style.dependencies, {core::UnistyleDependency::Variants})) {
                parser.parseUnistyleToJSIObject(rt, style, stylesWithVariants);
            }
        }

        return stylesWithVariants;
    });

    // attach addVariants to stylesheet
    helpers::defineHiddenProperty(rt, parsedStyleSheet, helpers::ADD_VARIANTS_FN, std::move(addVariantsHostFn));

    // attach addNode and removeNode to each style
    helpers::enumerateJSIObject(rt, parsedStyleSheet, [&](const std::string& propertyName, jsi::Value& propertyValue){
        auto addNodeHostFn = jsi::Function::createFromHostFunction(rt, addNodeFnName, 1,
            [&, propertyName](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            helpers::assertThat(rt, count == 1, "expected to be called with one argument,");
            helpers::assertThat(rt, args[0].isNumber(), "expected to be called with number.");

            auto nativeTag = args[0].asNumber();
            auto it = std::find_if(
                styleSheet.unistyles.begin(),
                styleSheet.unistyles.end(),
                [&propertyName](const core::Unistyle& style) {
                    return style.styleKey == propertyName;
                }
            );

            if (it != styleSheet.unistyles.end()) {
                it->nativeTags.push_back(nativeTag);
            }

            return jsi::Value::undefined();
        });
        auto removeNodeHostFn = jsi::Function::createFromHostFunction(rt, removeNodeFnName, 1,
            [&, propertyName](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            helpers::assertThat(rt, count == 1, "expected to be called with one argument,");
            helpers::assertThat(rt, args[0].isNumber(), "expected to be called with number.");

            auto nativeTag = args[0].asNumber();
            auto it = std::find_if(
                styleSheet.unistyles.begin(),
                styleSheet.unistyles.end(),
                [&propertyName](const core::Unistyle& style) {
                    return style.styleKey == propertyName;
                }
            );

            auto tagIt = std::find(it->nativeTags.begin(), it->nativeTags.end(), nativeTag);

            if (tagIt != it->nativeTags.end()) {
                it->nativeTags.erase(tagIt);
            }

            return jsi::Value::undefined();
        });

        auto style = jsi::Value(rt, propertyValue).asObject(rt);

        helpers::defineHiddenProperty(rt, style, helpers::ADD_NODE_FN, std::move(addNodeHostFn));
        helpers::defineHiddenProperty(rt, style, helpers::REMOVE_NODE_FN, std::move(removeNodeHostFn));
    });
}

void HybridStyleSheet::onPlatformEvent(PlatformEvent event) {
    // todo compare values, call methods only when value changed
    auto dependencies = helpers::getUnistyleDependenciesFromPlatformEvent(event);

    this->updateUnistylesWithDependencies(dependencies);
}

void HybridStyleSheet::updateUnistylesWithDependencies(std::vector<core::UnistyleDependency>& dependencies) {
    auto styleSheets = this->styleSheetRegistry.getStyleSheetsWithDependencies(dependencies);
    auto rt = this->unistylesRuntime->rt;
    auto& state = core::UnistylesRegistry::get().getState(*rt);
    std::vector<std::pair<std::string, std::string>> variants{};
    Dimensions dimensions{400, 800};
    auto settings = std::make_unique<parser::ParserSettings>(
        variants,
        state.getCurrentBreakpointName(),
        state.getSortedBreakpointPairs(),
        // todo
        dimensions
    );

    auto& parser = parser::Parser::configure(std::move(settings));
    std::vector<core::Unistyle*> unistylesToUpdate{};

    std::for_each(styleSheets.begin(), styleSheets.end(), [&](const core::StyleSheet* styleSheet){
        auto unistyles = this->styleSheetRegistry.recompute(*rt, styleSheet, dependencies);

        std::for_each(unistyles.begin(), unistyles.end(), [&](const core::Unistyle* unistyle){
            auto mutatedUnistyle = const_cast<core::Unistyle*>(unistyle);

            parser.parseUnistyle(*rt, *mutatedUnistyle);
            unistylesToUpdate.push_back(mutatedUnistyle);

            mutatedUnistyle->isDirty = false;
        });
    });

    auto viewUpdates = parser.unistylesToViewUpdates(*rt, unistylesToUpdate);

    if (viewUpdates.size() > 0) {
        shadow::ShadowTreeManager::updateShadowTree(*rt, viewUpdates);
    }
}
