#include "HybridStyleSheet.h"

double HybridStyleSheet::getHairlineWidth() {
    auto pixelRatio = this->nativePlatform.getPixelRatio();
    auto nearestPixel = static_cast<int>(std::trunc(pixelRatio * 0.4));

    return nearestPixel / pixelRatio;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    // todo remove me with nitro 0.6
    helpers::assertThat(rt, count == 1, "expected to be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "expected to be called with object or function.");

    auto styleSheetId = thisVal.asObject(rt).getProperty(rt, helpers::STYLESHEET_ID.c_str());

    // this might happen only when hot reloading
    if (!styleSheetId.isUndefined()) {
        styleSheetRegistry.remove(styleSheetId.asNumber());
    }

    jsi::Object rawStyleSheet = arguments[0].asObject(rt);
    core::StyleSheet& registeredStyleSheet = styleSheetRegistry.add(rt, std::move(rawStyleSheet));
    auto parsedStyleSheet = styleSheetRegistry.parse(rt, registeredStyleSheet);

    this->attachMetaFunctions(rt, registeredStyleSheet, parsedStyleSheet);

    // todo
    // attach ID
    // return HO

    return parsedStyleSheet;
}

jsi::Value HybridStyleSheet::configure(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    // todo remove me with nitro 0.6
    helpers::assertThat(rt, count == 1, "expected to be called with one argument.");
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

        return jsi::Value::undefined();
    });

    // attach addVariants to stylesheet
    helpers::defineHiddenProperty(rt, std::move(parsedStyleSheet), helpers::ADD_VARIANTS_FN, std::move(addVariantsHostFn));

    // attach addNode and removeNode to each style
    helpers::enumerateJSIObject(rt, parsedStyleSheet, [&](const std::string& propertyName, jsi::Value& propertyValue){
        auto addNodeHostFn = jsi::Function::createFromHostFunction(rt, addNodeFnName, 1,
            [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            // todo

            return jsi::Value::undefined();
        });
        auto removeNodeHostFn = jsi::Function::createFromHostFunction(rt, removeNodeFnName, 1,
            [](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            // todo

            return jsi::Value::undefined();
        });

        helpers::defineHiddenProperty(rt, propertyValue.asObject(rt), helpers::ADD_NODE_FN, std::move(addNodeHostFn));
        helpers::defineHiddenProperty(rt, propertyValue.asObject(rt), helpers::REMOVE_NODE_FN, std::move(removeNodeHostFn));
    });
}
