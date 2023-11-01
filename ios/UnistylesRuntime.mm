#import "UnistylesRuntime.h"

std::vector<jsi::PropNameID> UnistylesRuntime::getPropertyNames(jsi::Runtime& rt) {
    std::vector<jsi::PropNameID> properties;

    // getters
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("theme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("breakpoint")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("colorScheme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("sortedBreakpointPairs")));

    // setters
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useBreakpoints")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useTheme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useColorScheme")));
    properties.push_back(jsi::PropNameID::forUtf8(rt, std::string("useFeatureFlags")));

    return properties;
}


jsi::Value UnistylesRuntime::get(jsi::Runtime& runtime, const jsi::PropNameID& propNameId) {
    std::string propName = propNameId.utf8(runtime);
    
    if (propName == "theme") {
        return !this->theme.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->theme))
            : jsi::Value::undefined();
    }
    
    if (propName == "breakpoint") {
        return !this->breakpoint.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->breakpoint))
            : jsi::Value::undefined();
    }
    
    if (propName == "colorScheme") {
        return !this->colorScheme.empty()
            ? jsi::Value(jsi::String::createFromUtf8(runtime, this->colorScheme))
            : jsi::Value::undefined();
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
            
                this->theme = themeName;

                return jsi::Value::undefined();
            }
        );
    }
    
    if (propName == "useColorScheme") {
        return jsi::Function::createFromHostFunction(runtime,
            jsi::PropNameID::forAscii(runtime, "useColorScheme"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                std::string colorScheme = arguments[0].asString(runtime).utf8(runtime);

                this->colorScheme = colorScheme;

                return jsi::Value::undefined();
            }
        );
    }
    
    if (propName == "useFeatureFlags") {
        return jsi::Function::createFromHostFunction(runtime,
            jsi::PropNameID::forAscii(runtime, "useFeatureFlags"),
            1,
            [this](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
                jsi::Array featureFlagsArray = arguments[0].asObject(runtime).asArray(runtime);
                size_t length = featureFlagsArray.size(runtime);
                std::vector<std::string> featureFlags;
                featureFlags.reserve(length);
                    
                for (size_t i = 0; i < length; ++i) {
                    jsi::Value element = featureFlagsArray.getValueAtIndex(runtime, i);

                    if (element.isString()) {
                        std::string featureFlag = element.asString(runtime).utf8(runtime);
                        featureFlags.push_back(featureFlag);
                    }
                }

                this->featureFlags = featureFlags;
            
                
                return jsi::Value::undefined();
            }
        );
    }
   
    return jsi::Value::undefined();
}
