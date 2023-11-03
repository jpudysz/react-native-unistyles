#import "UnistylesRuntime.h"

std::vector<jsi::PropNameID> UnistylesRuntime::getPropertyNames(jsi::Runtime& rt) {
    std::vector<jsi::PropNameID> properties;

    // getters
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("screenWidth")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("screenHeight")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("hasAdaptiveThemes")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("theme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("breakpoint")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("colorScheme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("sortedBreakpointPairs")));
    
    // setters
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("themes")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useBreakpoints")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useTheme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useAdaptiveThemes")));
    
    return properties;
}


jsi::Value UnistylesRuntime::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
    std::string propName = propNameId.utf8(runtime);
    
    if (propName == "screenWidth") {
        return jsi::Value(this->screenWidth);
    }

    if (propName == "screenHeight") {
        return jsi::Value(this->screenHeight);
    }
    
    if (propName == "hasAdaptiveThemes") {
        return jsi::Value(this->hasAdaptiveThemes);
    }
    
    if (propName == "theme") {
        return !this->theme.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->theme))
            : this->getThemeOrFail(runtime);
    }
    
    if (propName == "breakpoint") {
        return !this->breakpoint.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->breakpoint))
            : jsi::Value::undefined();
    }
    
    if (propName == "colorScheme") {
        return jsi::Value(jsi::String::createFromUtf8(runtime, this->colorScheme));
    }

    if (propName == "sortedBreakpointPairs") {
        std::unique_ptr<jsi::Array> sortedBreakpointEntriesArray = std::make_unique<jsi::Array>(runtime, this->sortedBreakpointEntries.size());
            
        for (size_t i = 0; i < this->sortedBreakpointEntries.size(); ++i) {
            std::unique_ptr<jsi::Array> pairArray = std::make_unique<jsi::Array>(runtime, 2);
            jsi::String nameValue = jsi::String::createFromUtf8(runtime, this->sortedBreakpointEntries[i].first);
            
            pairArray->setValueAtIndex(runtime, 0, nameValue);
            pairArray->setValueAtIndex(runtime, 1, jsi::Value(this->sortedBreakpointEntries[i].second));
            sortedBreakpointEntriesArray->setValueAtIndex(runtime, i, *pairArray);
        }
        
        return jsi::Value(runtime, *sortedBreakpointEntriesArray);
    }
    
    if (propName == "useBreakpoints") {
        return jsi::Function::createFromHostFunction(
           runtime,
           jsi::PropNameID::forAscii(runtime, "useBreakpoints"),
           1,
           [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                jsi::Object breakpointsObj = arguments[0].asObject(runtime);
                jsi::Array propertyNames = breakpointsObj.getPropertyNames(runtime);
                std::vector<std::pair<std::string, double>> sortedBreakpointEntriesVec;

                for (size_t i = 0; i < propertyNames.size(runtime); ++i) {
                    jsi::Value propNameValue = propertyNames.getValueAtIndex(runtime, i);
                    std::string name = propNameValue.asString(runtime).utf8(runtime);
                    jsi::PropNameID propNameID = jsi::PropNameID::forUtf8(runtime, name);
                    jsi::Value value = breakpointsObj.getProperty(runtime, propNameID);

                    if (value.isNumber()) {
                        double breakpointValue = value.asNumber();
                        sortedBreakpointEntriesVec.push_back(std::make_pair(name, breakpointValue));
                    }
                }

                std::sort(sortedBreakpointEntriesVec.begin(), sortedBreakpointEntriesVec.end(), [](const std::pair<std::string, double>& a, const std::pair<std::string, double>& b) {
                        return a.second < b.second;
                });

                this->sortedBreakpointEntries = sortedBreakpointEntriesVec;
                
               std::string breakpoint = this->getBreakpointFromScreenWidth(this->screenWidth, sortedBreakpointEntriesVec);

               this->breakpoint = breakpoint;

               return jsi::Value::undefined();
           }
         );
    }
    
    if (propName == "useTheme") {
        return jsi::Function::createFromHostFunction(runtime,
            jsi::PropNameID::forAscii(runtime, "useTheme"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                std::string themeName = arguments[0].asString(runtime).utf8(runtime);
                NSString *currentTheme = [NSString stringWithUTF8String:themeName.c_str()];
            
                this->theme = themeName;
                this->onThemeChange(themeName);

                return jsi::Value::undefined();
            }
        );
    }
    
    if (propName == "useAdaptiveThemes") {
        return jsi::Function::createFromHostFunction(runtime,
            jsi::PropNameID::forAscii(runtime, "useAdaptiveThemes"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                bool enableAdaptiveThemes = arguments[0].asBool();

                this->hasAdaptiveThemes = enableAdaptiveThemes;
            
                if (!enableAdaptiveThemes || !this->supportsAutomaticColorScheme) {
                    return jsi::Value::undefined();
                }

                this->theme = this->colorScheme;
//                this->onThemeChange(this->theme);

                return jsi::Value::undefined();
            }
        );
    }
    
    return jsi::Value::undefined();
}

void UnistylesRuntime::set(jsi::Runtime& runtime, const jsi::PropNameID& propNameId, const jsi::Value& value) {
    std::string propName = propNameId.utf8(runtime);
    
    if (propName == "themes" && value.isObject()) {
        jsi::Array themes = value.asObject(runtime).asArray(runtime);
        std::vector<std::string> themesVector;
        size_t length = themes.size(runtime);
        
        for (size_t i = 0; i < length; ++i) {
            jsi::Value element = themes.getValueAtIndex(runtime, i);

            if (element.isString()) {
                std::string theme = element.asString(runtime).utf8(runtime);
                themesVector.push_back(theme);
            }
        }
        
        this->themes = themesVector;
        
        bool hasLightTheme = std::find(themesVector.begin(), themesVector.end(), "light") != themesVector.end();
        bool hasDarkTheme = std::find(themesVector.begin(), themesVector.end(), "dark") != themesVector.end();
        
        this->supportsAutomaticColorScheme = hasLightTheme && hasDarkTheme;
        
        return;
    }
}

std::string UnistylesRuntime::getBreakpointFromScreenWidth(double width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries) {
    for (size_t i = 0; i < sortedBreakpointEntries.size(); ++i) {
        const auto& [key, value] = sortedBreakpointEntries[i];
        const double maxVal = (i + 1 < sortedBreakpointEntries.size()) ? sortedBreakpointEntries[i + 1].second : std::numeric_limits<double>::infinity();

        if (width >= value && width < maxVal) {
            return key;
        }
    }
    
    return sortedBreakpointEntries.empty() ? "" : sortedBreakpointEntries.back().first;
}

void UnistylesRuntime::handleScreenSizeChange(int width, int height) {
    if (width != this->screenWidth) {
        this->screenWidth = width;
    }
    
    if (height != this->screenHeight) {
        this->screenHeight = height;
    }
    
    std::string currentBreakpoint = this->breakpoint;
    std::string nextBreakpoint = this->getBreakpointFromScreenWidth(width, this->sortedBreakpointEntries);
    
    if (currentBreakpoint != nextBreakpoint) {
        this->breakpoint = nextBreakpoint;
        this->onBreakpointChange(nextBreakpoint);
    }
}

void UnistylesRuntime::handleAppearanceChange(std::string colorScheme) {
    this->colorScheme = colorScheme;
    
    if (!this->supportsAutomaticColorScheme || !this->hasAdaptiveThemes) {
        return;
    }
    
    this->theme = this->colorScheme;
    this->onThemeChange(this->theme);
}

jsi::Value UnistylesRuntime::getThemeOrFail(jsi::Runtime& runtime) {
    if (this->themes.size() == 1) {
        std::string themeName = this->themes.at(0);

        this->theme = themeName;
        
        return jsi::String::createFromUtf8(runtime, themeName);
    }
    
    return jsi::Value().undefined();
}
