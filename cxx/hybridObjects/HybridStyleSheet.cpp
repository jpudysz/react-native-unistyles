#include "HybridStyleSheet.h"

double HybridStyleSheet::getHairlineWidth() {
    auto pixelRatio = this->_unistylesRuntime->getPixelRatio();
    auto nearestPixel = static_cast<int>(std::trunc(pixelRatio * 0.4));

    return nearestPixel / pixelRatio;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, arguments[0].isObject(), "expected to be called with object or function.");

    return arguments[0].asObject(rt);
}

jsi::Value HybridStyleSheet::configure(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, arguments[0].isObject(), "expected to be called with object.");

    auto config = arguments[0].asObject(rt);

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
    helpers::enumerateJSIObject(rt, settings, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "adaptiveThemes") {
            helpers::assertThat(rt, propertyValue.isBool(), "adaptiveThemes configuration must be of boolean type.");

            this->_unistylesRuntime->_state->setPrefersAdaptiveThemes(propertyValue.asBool());

            return;
        }

        if (propertyName == "initialTheme") {
            if (propertyValue.isObject()) {
                helpers::assertThat(rt, propertyValue.asObject(rt).isFunction(rt), "initialTheme configuration must be either a string or a function.");

                return this->_unistylesRuntime->_state->setInitialThemeNameCallback(propertyValue.asObject(rt).asFunction(rt));
            }

            helpers::assertThat(rt, propertyValue.isString(), "initialTheme configuration must be either a string or a function.");

            this->_unistylesRuntime->_state->setInitialThemeName(propertyValue.asString(rt).utf8(rt));

            return;
        }

        helpers::assertThat(rt, false, "settings received unexpected key: '" + std::string(propertyName) + "'");
    });
}

void HybridStyleSheet::parseBreakpoints(jsi::Runtime &rt, jsi::Object breakpoints){
    helpers::Breakpoints sortedBreakpoints = helpers::jsiBreakpointsToVecPairs(rt, std::move(breakpoints));

    helpers::assertThat(rt, sortedBreakpoints.size() > 0, "registered breakpoints can't be empty.");
    helpers::assertThat(rt, sortedBreakpoints.front().second == 0, "first breakpoint must start from 0.");

    this->_unistylesRuntime->_state->registerBreakpoints(sortedBreakpoints);
    this->_unistylesRuntime->_state->computeCurrentBreakpoint(this->_unistylesRuntime->getScreen().width);
}

void HybridStyleSheet::parseThemes(jsi::Runtime &rt, jsi::Object themes) {
    helpers::enumerateJSIObject(rt, themes, [&](const std::string& propertyName, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "registered theme '" + propertyName + "' must be an object.");

        this->_unistylesRuntime->_state->registerTheme(rt, propertyName, propertyValue.asObject(rt));
    });
}

void HybridStyleSheet::verifyAndSelectTheme(jsi::Runtime &rt) {
    bool hasInitialTheme = this->_unistylesRuntime->_state->hasInitialTheme();
    bool prefersAdaptiveThemes = this->_unistylesRuntime->_state->getPrefersAdaptiveThemes();
    bool hasAdaptiveThemes = this->_unistylesRuntime->_state->hasAdaptiveThemes();
    std::vector<std::string> registeredThemeNames = this->_unistylesRuntime->_state->getRegisteredThemeNames();
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
        return this->_unistylesRuntime->_state->setTheme(registeredThemeNames.at(0));
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
    std::string selectedTheme = this->_unistylesRuntime->_state->getInitialTheme().value();

    helpers::assertThat(rt, this->_unistylesRuntime->_state->hasTheme(selectedTheme), "you're trying to select theme '" + selectedTheme + "' but it wasn't registered.");

    this->_unistylesRuntime->_state->setTheme(selectedTheme);
}

void HybridStyleSheet::setThemeFromColorScheme(jsi::Runtime& rt) {
    ColorScheme colorScheme = static_cast<ColorScheme>(this->_unistylesRuntime->getColorScheme());

    switch (colorScheme) {
        case ColorScheme::LIGHT:
            this->_unistylesRuntime->_state->setTheme("light");

            return;
        case ColorScheme::DARK:
            this->_unistylesRuntime->_state->setTheme("dark");

            return;
        default:
            throw std::runtime_error("unable to set adaptive theme as your device doesn't support it.");
    }
}
