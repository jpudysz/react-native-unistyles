#include "StyleSheet.h"
#include <jsi/jsi.h>
#include <react/renderer/uimanager/UIManager.h>

using namespace facebook::react;
using namespace unistyles::helpers;

// Base Unistyles function that
// - registers stylesheet
// - attaches addNode, removeNode and addVariants functions
// - attaches unique StyleSheet ID
// - returns pardes stylesheet to React (on first render)
jsi::Value StyleSheet::create(jsi::Runtime& rt, std::string fnName) {
    return createHostFunction(rt, "create", 1, [this](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
        assertThat(rt, count == 1, "StyleSheet.create must be called with one argument");
        assertThat(rt, arguments[0].isObject(), "StyleSheet.create must be called with object or function");

        auto styleSheetId = thisVal.asObject(rt).getProperty(rt, "__id");

        // this might happen only when hot reloading
        if (!styleSheetId.isUndefined()) {
            styleSheetRegistry.remove(styleSheetId.asNumber());
        }

        auto rawStyleSheet = arguments[0].asObject(rt);
        auto& registeredStyleSheet = styleSheetRegistry.add(std::move(rawStyleSheet));
        auto parsedStyleSheet = styleSheetRegistry.dereferenceStyleSheet(registeredStyleSheet);

        enumerateJSIObject(rt, parsedStyleSheet, [&](const std::string& propertyName, jsi::Object& propertyValue){
            auto addNodeHostFn = createHostFunction(rt, "addNode", 1, [&registeredStyleSheet, propertyName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
                auto nativeTag = arguments[0].asNumber();
                auto it = std::find_if(
                   registeredStyleSheet.styles.begin(),
                   registeredStyleSheet.styles.end(),
                   [&propertyName](const Unistyle& style) {
                       return style.name == propertyName;
                   }
                );

                if (it != registeredStyleSheet.styles.end()) {
                    it->nativeTags.push_back(nativeTag);
                }

                return jsi::Value::undefined();
            });

            auto removeNodeHostFn = createHostFunction(rt, "removeNode", 1, [&registeredStyleSheet, propertyName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
                auto nativeTag = arguments[0].asNumber();
                auto it = std::find_if(
                   registeredStyleSheet.styles.begin(),
                   registeredStyleSheet.styles.end(),
                   [&propertyName](const Unistyle& style) {
                       return style.name == propertyName;
                   }
                );

                auto tagIt = std::find(it->nativeTags.begin(), it->nativeTags.end(), nativeTag);

                if (tagIt != it->nativeTags.end()) {
                    it->nativeTags.erase(tagIt);
                }

                return jsi::Value::undefined();
            });

            defineFunctionProperty(rt, propertyValue, "addNode", addNodeHostFn);
            defineFunctionProperty(rt, propertyValue, "removeNode", removeNodeHostFn);
        });

        auto addVariantsFn = createHostFunction(rt, ADD_VARIANTS_FN, 1, [this, &registeredStyleSheet](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count){
            registeredStyleSheet.addVariants(rt, jsi::Value(rt, arguments[0]));
            jsi::Object stylesWithVariants = jsi::Object(rt);
            
            for (auto& style: registeredStyleSheet.styles) {
                if (style.hasVariants) {
                    stylesWithVariants.setProperty(rt, style.name.c_str(), style.parseStyle(rt, registeredStyleSheet.variants));
                }
            }

            return stylesWithVariants;
        });

        defineFunctionProperty(rt, parsedStyleSheet, ADD_VARIANTS_FN, addVariantsFn);

        auto thisStyleSheet = thisVal.asObject(rt);

        defineFunctionProperty(rt, thisStyleSheet, "__id", jsi::Value(registeredStyleSheet.tag));

        auto style = std::make_shared<HostStyle>(parsedStyleSheet);
        auto styleHostObject = jsi::Object::createFromHostObject(rt, style);

        return styleHostObject;
    });
}

jsi::Value StyleSheet::configure(jsi::Runtime& rt, std::string fnName) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "configure"),
        1,
        [this, &fnName](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            assertThat(rt, count == 1, "StyleSheet.configure must be called with one argument");
            assertThat(rt, arguments[0].isObject(), "StyleSheet.configure must be called with function");
            auto config = arguments[0].asObject(rt);

            enumerateJSIObject(rt, config, [&](const std::string& propertyName, jsi::Object& propertyValue){
                if (propertyName == "settings") {
                    auto settings = jsi::dynamicFromValue(rt, jsi::Value(rt, propertyValue));

                    return this->parseSettings(rt, settings);
                }

                // themes live on JS side and selected theme is loaded dynamically
                // to C++ during parsing
                if (propertyName == "themes") {
                    return;
                }

                if (propertyName == "breakpoints") {
                    return this->parseBreakpoints(rt, propertyValue);
                }

                assertThat(rt, false, "StyleSheet.configure called with unknown setting: " + propertyName);
            });

            return jsi::Value::undefined();
        }
    );
}

void StyleSheet::parseSettings(jsi::Runtime& rt, folly::dynamic& settings) {
    auto maybeAdaptiveThemes = getIfExists(settings, "adaptiveThemes");
    auto maybeInitialTheme = getIfExists(settings, "initialTheme");

    bool adaptiveThemes = maybeAdaptiveThemes != nullptr
        ? maybeAdaptiveThemes.asBool()
        : false;
    std::string initialTheme = maybeInitialTheme != nullptr
        ? maybeInitialTheme.asString()
        : "";

    assertThat(rt, !(adaptiveThemes && initialTheme != ""), "You can't select initialTheme if you enabled adaptiveThemes");

    this->unistylesRuntime->hasAdaptiveThemes = adaptiveThemes;
    this->unistylesRuntime->themeName = initialTheme;
}

void StyleSheet::parseBreakpoints(jsi::Runtime& rt, jsi::Object &breakpoints) {
    auto sortedBreakpoints = this->unistylesRuntime->toSortedBreakpointPairs(rt, breakpoints);

    assertThat(rt, sortedBreakpoints.size() > 0, "registered breakpoints can't be empty");
    assertThat(rt, sortedBreakpoints.front().second == 0, "first breakpoint must start from 0");

    this->unistylesRuntime->sortedBreakpointPairs = sortedBreakpoints;

    std::string breakpoint = this->unistylesRuntime->getBreakpointFromScreenWidth(this->unistylesRuntime->screen.width, sortedBreakpoints);

    this->unistylesRuntime->breakpoint = breakpoint;
}

void StyleSheet::emitEvent(jsi::Runtime&, std::vector<StyleDependency> dependencies) {
    auto styles = this->styleSheetRegistry.getStylesWithDependencies(dependencies);

    for (const Unistyle* unistyle : styles) {
        auto styleToUpdate = const_cast<Unistyle*>(unistyle);
        
        // todo batch mutate shadow tree
        // todo batch update native views
    }
}
