#include "HybridStyleSheet.h"

double HybridStyleSheet::getHairlineWidth() {
    auto pixelRatio = this->nativePlatform.getPixelRatio();
    auto nearestPixel = static_cast<int>(std::trunc(pixelRatio * 0.4));
    
    return nearestPixel / pixelRatio;
}

jsi::Value HybridStyleSheet::create(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, count == 1, "StyleSheet.create must be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.create must be called with object or function.");

    auto styleSheetId = thisVal.asObject(rt).getProperty(rt, "__id");

    // this might happen only when hot reloading
    if (!styleSheetId.isUndefined()) {
        styleSheetRegistry.remove(styleSheetId.asNumber());
    }
    
    jsi::Object rawStyleSheet = arguments[0].asObject(rt);
    core::StyleSheet& registeredStyleSheet = styleSheetRegistry.add(rt, std::move(rawStyleSheet));
    auto parsedStyleSheet = styleSheetRegistry.parse(rt, registeredStyleSheet);
    
    // todo
    
    return jsi::Object(rt);
}

jsi::Value HybridStyleSheet::configure(jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) {
    helpers::assertThat(rt, count == 1, "StyleSheet.configure must be called with one argument.");
    helpers::assertThat(rt, arguments[0].isObject(), "StyleSheet.configure must be called with object.");
    
    auto config = arguments[0].asObject(rt);
    
    helpers::enumerateJSIObject(rt, config, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "settings") {
            helpers::assertThat(rt, propertyValue.isObject(), "settings passed to StyleSheet.configure must be an object.");
            
            return this->parseSettings(rt, propertyValue.asObject(rt));
        }
        
        if (propertyName == "breakpoints") {
            helpers::assertThat(rt, propertyValue.isObject(), "breakpoints passed to StyleSheet.configure must be an object.");
            
            return this->parseBreakpoints(rt, propertyValue.asObject(rt));
        }
        
        if (propertyName == "themes") {
            helpers::assertThat(rt, propertyValue.isObject(), "themes passed to StyleSheet.configure must be an object.");
            
            return this->parseThemes(rt, propertyValue.asObject(rt));
        }
        
        helpers::assertThat(rt, false, "StyleSheet.configure received unexpected key: '" + std::string(propertyName) + "'.");
    });
    
    verifyAndSelectTheme(rt);
    
    return jsi::Value::undefined();
}

void HybridStyleSheet::parseSettings(jsi::Runtime &rt, jsi::Object settings) {
    helpers::enumerateJSIObject(rt, settings, [&](const std::string& propertyName, jsi::Value& propertyValue){
        if (propertyName == "adaptiveThemes") {
            helpers::assertThat(rt, propertyValue.isBool(), "adaptiveThemes configuration must be of boolean type.");
            
            // set adaptive theme only once, this function might be triggered during hot reload
            if (this->unistylesRuntime->prefersAdaptiveThemes == std::nullopt) {
                this->unistylesRuntime->prefersAdaptiveThemes = propertyValue.asBool();
            }
            
            return;
        }
        
        if (propertyName == "initialTheme") {
            helpers::assertThat(rt, propertyValue.isString(), "initialTheme configuration must be of string type.");
            
            this->unistylesRuntime->initialThemeName = propertyValue.asString(rt).utf8(rt);
            
            return;
        }
        
        helpers::assertThat(rt, false, "StyleSheet.configure object has unexpected key for settings: '" + std::string(propertyName) + "'");
    });
}

void HybridStyleSheet::parseBreakpoints(jsi::Runtime &rt, jsi::Object breakpoints){
    helpers::Breakpoints sortedBreakpoints = helpers::jsiBreakpointsToVecPairs(rt, std::move(breakpoints));
    
    helpers::assertThat(rt, sortedBreakpoints.size() > 0, "registered breakpoints can't be empty.");
    helpers::assertThat(rt, sortedBreakpoints.front().second == 0, "first breakpoint must start from 0.");
    
    this->unistylesRuntime->sortedBreakpointPairs = std::move(sortedBreakpoints);
    this->unistylesRuntime->currentBreakpointName = helpers::getBreakpointFromScreenWidth(
        this->nativePlatform.getScreenDimensions().width,
        this->unistylesRuntime->sortedBreakpointPairs
    );
}

void HybridStyleSheet::parseThemes(jsi::Runtime &rt, jsi::Object themes) {
    helpers::enumerateJSIObject(rt, themes, [&](const std::string& propertyName, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "registered theme must be an object.");
        
        this->unistylesRuntime->themePairs.emplace_back(std::move(propertyName), propertyValue.asObject(rt));
    });
}

void HybridStyleSheet::verifyAndSelectTheme(jsi::Runtime &rt) {
    // Set metadata about adaptive themes
    bool canHaveAdaptiveThemes = helpers::vecPairsContainsKeys(this->unistylesRuntime->themePairs, {"light", "dark"});
    this->unistylesRuntime->canHaveAdaptiveThemes = canHaveAdaptiveThemes;
    
    bool hasInitialTheme = this->unistylesRuntime->initialThemeName.has_value();
    bool hasAdaptiveThemes = this->unistylesRuntime->getHasAdaptiveThemes();

    // user didn't select initial theme nor can have adaptive themes, do nothing
    // user must select initial theme during runtime
    if (!hasInitialTheme && !hasAdaptiveThemes) {
        return;
    }
    
    // user didn't select initial theme, but has adaptive themes
    // simply select theme based on color scheme
    if (!hasInitialTheme && hasAdaptiveThemes) {
        return this->setThemeFromColorScheme();
    }
    
    // user selected both initial theme and adaptive themes
    // we should throw an error as these options are mutually exclusive
    if (hasInitialTheme && hasAdaptiveThemes) {
        this->unistylesRuntime->initialThemeName = std::nullopt;
        
        helpers::assertThat(rt, false, "you're trying to set initial theme and enable adaptiveThemes, but these options are mutually exclusive.");
    }
    
    // user only selected initial theme
    // validate if following theme exist
    std::string selectedTheme = this->unistylesRuntime->initialThemeName.value();
    bool hasRegisteredTheme = helpers::vecPairsContainsKeys(this->unistylesRuntime->themePairs, {selectedTheme});
    
    helpers::assertThat(rt, hasRegisteredTheme, "initial theme '" + selectedTheme + "' has not been registered.");
    
    this->unistylesRuntime->currentThemeName = selectedTheme;
}

void HybridStyleSheet::setThemeFromColorScheme() {
    ColorScheme colorScheme = static_cast<ColorScheme>(this->nativePlatform.getColorScheme());
    
    switch (colorScheme) {
        case ColorScheme::LIGHT:
            this->unistylesRuntime->currentThemeName = "light";

            return;
        case ColorScheme::DARK:
            this->unistylesRuntime->currentThemeName = "dark";

            return;
        default:
            throw std::runtime_error("[Unistyles]: Unable to set adaptive theme as your device doesn't support it.");
    }
}

jsi::Object& HybridStyleSheet::getCurrentTheme() {
    auto currentTheme = this->unistylesRuntime->currentThemeName;
    auto registeredThemesCount = this->unistylesRuntime->themePairs.size();
    
    // if user registered a theme, but failed to select initial one
    if (!currentTheme.has_value() && registeredThemesCount > 0) {
        throw std::runtime_error("[Unistyles]: You registered " + std::to_string(registeredThemesCount) + " themes, but you didn't select any.");
    }
    
    auto it = std::find_if(this->unistylesRuntime->themePairs.begin(), this->unistylesRuntime->themePairs.end(), [&currentTheme](auto& pair){
        return pair.first == currentTheme.value();
    });
    
    // this should never happen
    if (it == this->unistylesRuntime->themePairs.end()) {
        throw std::runtime_error("[Unistyles]: tried to select '" + std::string(currentTheme.value()) + "' theme, but it wansn't registered.");
    }
    
    return it->second;
}

std::shared_ptr<HybridMiniRuntime> HybridStyleSheet::getMiniRuntime() {
    return this->miniRuntime;
}
