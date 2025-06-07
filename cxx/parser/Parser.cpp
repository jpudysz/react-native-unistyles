#include "Parser.h"
#include "UnistyleWrapper.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;
using namespace facebook::react;

using Variants = std::vector<std::pair<std::string, std::string>>;

// called only once while processing StyleSheet.create
void parser::Parser::buildUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    jsi::Object unwrappedStyleSheet = this->unwrapStyleSheet(rt, styleSheet, std::nullopt);

    helpers::enumerateJSIObject(rt, unwrappedStyleSheet, [&](const std::string& styleKey, jsi::Value& propertyValue){
        helpers::assertThat(rt, propertyValue.isObject(), "Unistyles: Style with name '" + styleKey + "' is not a function or object.");

        jsi::Object styleValue = propertyValue.asObject(rt);

        if (styleValue.isFunction(rt)) {
            styleSheet->unistyles[styleKey] = std::make_shared<UnistyleDynamicFunction>(
                helpers::HashGenerator::generateHash(styleKey + std::to_string(styleSheet->tag)),
                UnistyleType::DynamicFunction,
                styleKey,
                styleValue,
                styleSheet
            );

            return;
        }

        styleSheet->unistyles[styleKey] = std::make_shared<Unistyle>(
            helpers::HashGenerator::generateHash(styleKey + std::to_string(styleSheet->tag)),
            UnistyleType::Object,
            styleKey,
            styleValue,
            styleSheet
        );
    });
}

jsi::Value parser::Parser::getParsedStyleSheetForScopedTheme(jsi::Runtime& rt, core::Unistyle::Shared unistyle, std::string& scopedTheme) {
    // for static stylesheets and exotic styles we don't need to do anything
    if (unistyle->parent == nullptr || unistyle->parent->type == StyleSheetType::Static) {
        return jsi::Value::undefined();
    }

    auto& state = core::UnistylesRegistry::get().getState(rt);
    auto jsTheme = state.getJSThemeByName(scopedTheme);

    if (unistyle->parent->type == StyleSheetType::Themable) {
        return unistyle->parent->rawValue
            .asFunction(rt)
            .call(rt, std::move(jsTheme))
            .asObject(rt);
    }

    auto miniRuntime = this->_unistylesRuntime->getMiniRuntimeAsValue(rt, std::nullopt);

    return unistyle->parent->rawValue
        .asFunction(rt)
        .call(rt, std::move(jsTheme), std::move(miniRuntime))
        .asObject(rt);
}

void parser::Parser::rebuildUnistyleWithScopedTheme(jsi::Runtime& rt, jsi::Value& scopedStyleSheet, std::shared_ptr<core::UnistyleData> unistyleData) {
    auto parsedStyleSheet = scopedStyleSheet.isUndefined()
        ? this->getParsedStyleSheetForScopedTheme(rt, unistyleData->unistyle, unistyleData->scopedTheme.value())
        : scopedStyleSheet.asObject(rt);

    if (parsedStyleSheet.isUndefined()) {
        return;
    }

    // get target style
    auto targetStyle = parsedStyleSheet.asObject(rt).getProperty(rt, unistyleData->unistyle->styleKey.c_str()).asObject(rt);

    // for object we just need to parse it
    if (unistyleData->unistyle->type == UnistyleType::Object) {
        // we need to temporarly swap rawValue to enforce correct parings
        auto sharedRawValue = std::move(unistyleData->unistyle->rawValue);

        unistyleData->unistyle->rawValue = std::move(targetStyle);
        unistyleData->parsedStyle = this->parseFirstLevel(rt, unistyleData->unistyle, unistyleData->variants);
        unistyleData->unistyle->rawValue = std::move(sharedRawValue);

        return;
    }

    // for functions we need to call them with memoized arguments
    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyleData->unistyle);

    // convert arguments to jsi::Value
    std::vector<jsi::Value> args{};
    auto arguments = unistyleData->dynamicFunctionMetadata.value();

    args.reserve(arguments.size());

    for (int i = 0; i < arguments.size(); i++) {
        folly::dynamic& arg = arguments.at(i);

        args.emplace_back(jsi::valueFromDynamic(rt, arg));
    }

    const jsi::Value *argStart = args.data();

    // we need to temporarly swap unprocessed value to enforce correct parings
    auto sharedUnprocessedValue = std::move(unistyleFn->unprocessedValue);

    // call cached function with memoized arguments
    auto functionResult = targetStyle
        .asFunction(rt)
        .call(rt, argStart, arguments.size())
        .asObject(rt);

    unistyleFn->unprocessedValue = std::move(functionResult);
    unistyleData->parsedStyle = this->parseFirstLevel(rt, unistyleFn, unistyleData->variants);
    unistyleFn->unprocessedValue = std::move(sharedUnprocessedValue);
}

jsi::Object parser::Parser::unwrapStyleSheet(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet, std::optional<UnistylesNativeMiniRuntime> maybeMiniRuntime) {
    // firstly we need to get object representation of user's StyleSheet
    // StyleSheet can be a function or an object

    // StyleSheet is already an object
    if (styleSheet->type == StyleSheetType::Static) {
        return jsi::Value(rt, styleSheet->rawValue).asObject(rt);
    }

    // StyleSheet is a function
    auto& state = core::UnistylesRegistry::get().getState(rt);
    auto theme = state.getCurrentJSTheme();

    if (styleSheet->type == StyleSheetType::Themable) {
        return styleSheet->rawValue
            .asFunction(rt)
            .call(rt, std::move(theme))
            .asObject(rt);
    }

    // stylesheet also has a mini runtime dependency
    // StyleSheetType::ThemableWithMiniRuntime
    auto miniRuntime = this->_unistylesRuntime->getMiniRuntimeAsValue(rt, maybeMiniRuntime);

    return styleSheet->rawValue
        .asFunction(rt)
        .call(rt, std::move(theme), std::move(miniRuntime))
        .asObject(rt);
}

// parses all unistyles in StyleSheet
void parser::Parser::parseUnistyles(jsi::Runtime& rt, std::shared_ptr<StyleSheet> styleSheet) {
    for (const auto& [_, unistyle] : styleSheet->unistyles) {
        if (unistyle->type == core::UnistyleType::Object) {
            auto result = this->parseFirstLevel(rt, unistyle, std::nullopt);

            unistyle->parsedStyle = std::move(result);
            unistyle->seal();
        }

        if (unistyle->type == core::UnistyleType::DynamicFunction) {
            auto hostFn = this->createDynamicFunctionProxy(rt, unistyle);
            auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);

            // defer parsing dynamic functions
            unistyleFn->proxiedFunction = std::move(hostFn);
        }
    }
}

// rebuild all unistyles in StyleSheet that depends on variants
void parser::Parser::rebuildUnistyleWithVariants(jsi::Runtime& rt, std::shared_ptr<core::UnistyleData> unistyleData) {
    if (unistyleData->unistyle->styleKey == helpers::EXOTIC_STYLE_KEY) {
        unistyleData->parsedStyle = std::move(unistyleData->unistyle->rawValue);

        return;
    }

    if (unistyleData->unistyle->type == UnistyleType::Object) {
        unistyleData->parsedStyle = this->parseFirstLevel(rt, unistyleData->unistyle, unistyleData->variants);

        return;
    }

    // for functions we need to call them with memoized arguments
    auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyleData->unistyle);

    // convert arguments to jsi::Value
    std::vector<jsi::Value> args{};
    auto arguments = unistyleData->dynamicFunctionMetadata.value();

    args.reserve(arguments.size());

    for (int i = 0; i < arguments.size(); i++) {
        folly::dynamic& arg = arguments.at(i);

        args.emplace_back(jsi::valueFromDynamic(rt, arg));
    }

    const jsi::Value *argStart = args.data();

    // we need to temporarly swap unprocessed value to enforce correct parings
    auto sharedUnprocessedValue = std::move(unistyleFn->unprocessedValue);

    // call cached function with memoized arguments
    auto functionResult = unistyleFn->rawValue
        .asFunction(rt)
        .call(rt, argStart, arguments.size())
        .asObject(rt);

    unistyleFn->unprocessedValue = std::move(functionResult);
    unistyleData->parsedStyle = this->parseFirstLevel(rt, unistyleFn, unistyleData->variants);
    unistyleFn->unprocessedValue = std::move(sharedUnprocessedValue);
}

// rebuild all unistyles that are affected by platform event
void parser::Parser::rebuildUnistylesInDependencyMap(
    jsi::Runtime& rt,
    DependencyMap& dependencyMap,
    std::vector<std::shared_ptr<core::StyleSheet>>& styleSheets,
    std::optional<UnistylesNativeMiniRuntime> maybeMiniRuntime
) {
    std::unordered_map<std::shared_ptr<StyleSheet>, jsi::Value> parsedStyleSheetsWithDefaultTheme;
    std::unordered_map<std::string, std::unordered_map<std::shared_ptr<StyleSheet>, jsi::Value>> parsedStyleSheetsWithScopedTheme;
    std::unordered_set<std::shared_ptr<core::Unistyle>> parsedUnistyles;

    // Parse all stylesheets that depend on changes
    for (const auto& styleSheet : styleSheets) {
        parsedStyleSheetsWithDefaultTheme.emplace(
            styleSheet,
            this->unwrapStyleSheet(rt, styleSheet, maybeMiniRuntime)
        );
    }

    // Parse all visible Unistyles managed by Unistyle
    for (auto& [shadowNode, unistyles] : dependencyMap) {
        auto styleSheet = unistyles.front()->unistyle->parent;

        // Stylesheet may be optional for exotic unistyles
        if (styleSheet && parsedStyleSheetsWithDefaultTheme.find(styleSheet) == parsedStyleSheetsWithDefaultTheme.end()) {
            parsedStyleSheetsWithDefaultTheme.emplace(
                styleSheet,
                this->unwrapStyleSheet(rt, styleSheet, maybeMiniRuntime)
            );
        }

        for (auto& unistyleData : unistyles) {
            auto& unistyle = unistyleData->unistyle;

            // For RN styles or inline styles, compute styles only once
            if (unistyle->styleKey == helpers::EXOTIC_STYLE_KEY) {
                if (!unistyleData->parsedStyle.has_value()) {
                    unistyleData->parsedStyle = jsi::Value(rt, unistyle->rawValue).asObject(rt);
                    parsedUnistyles.insert(unistyle);
                }

                continue;
            }

            // Reference Unistyles StyleSheet as we may mix them for one style
            auto unistyleStyleSheet = unistyle->parent;

            // We may hit now other StyleSheets that are referenced from affected nodes
            if (unistyleStyleSheet && parsedStyleSheetsWithDefaultTheme.find(unistyleStyleSheet) == parsedStyleSheetsWithDefaultTheme.end()) {
                parsedStyleSheetsWithDefaultTheme.emplace(
                    unistyleStyleSheet,
                    this->unwrapStyleSheet(rt, unistyleStyleSheet, maybeMiniRuntime)
                );
            }

            // StyleSheet might have styles that are not affected
            auto& parsedSheetValue = parsedStyleSheetsWithDefaultTheme[unistyleStyleSheet];
            auto parsedSheetObj = parsedSheetValue.asObject(rt);

            if (!parsedSheetObj.hasProperty(rt, unistyle->styleKey.c_str())) {
                continue;
            }

            // For scoped themes we need to parse unistyle exclusively
            if (unistyleData->scopedTheme.has_value()) {
                auto& scopedThemeName = unistyleData->scopedTheme.value();
                auto& scopedThemeMap = parsedStyleSheetsWithScopedTheme[scopedThemeName];

                jsi::Value parsedStyleSheet = jsi::Value::undefined();
                auto it = scopedThemeMap.find(unistyle->parent);

                if (it != scopedThemeMap.end()) {
                    parsedStyleSheet = jsi::Value(rt, it->second);
                }

                if (parsedStyleSheet.isUndefined()) {
                    parsedStyleSheet = this->getParsedStyleSheetForScopedTheme(rt, unistyle, scopedThemeName);
                    scopedThemeMap.emplace(
                        unistyle->parent,
                        jsi::Value(rt, parsedStyleSheet)
                    );
                }

                this->rebuildUnistyleWithScopedTheme(rt, parsedStyleSheet, unistyleData);
            } else {
                unistyle->rawValue = parsedSheetObj
                    .getProperty(rt, unistyle->styleKey.c_str())
                    .asObject(rt);
                this->rebuildUnistyle(
                    rt, unistyle, unistyleData->variants,
                    unistyleData->dynamicFunctionMetadata
                );
                unistyleData->parsedStyle = jsi::Value(rt, unistyle->parsedStyle.value()).asObject(rt);
                unistyle->isDirty = true;
            }

            parsedUnistyles.insert(unistyle);
        }
    }

    // Parse whatever left in StyleSheets to be later accessible
    for (const auto& styleSheet : styleSheets) {
        auto& parsedSheetValue = parsedStyleSheetsWithDefaultTheme[styleSheet];
        auto parsedSheetObj = parsedSheetValue.asObject(rt);

        for (auto& [_, unistyle] : styleSheet->unistyles) {
            if (!parsedUnistyles.contains(unistyle)) {
                unistyle->rawValue = parsedSheetObj
                    .getProperty(rt, unistyle->styleKey.c_str())
                    .asObject(rt);
                unistyle->isDirty = true;
            }
        }
    }
}

// rebuild single unistyle
void parser::Parser::rebuildUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle, const Variants& variants, std::optional<std::vector<folly::dynamic>> metadata) {
    if (unistyle->type == core::UnistyleType::Object) {
        auto result = this->parseFirstLevel(rt, unistyle, variants);

        unistyle->parsedStyle = std::move(result);
    }

    // for functions we need to call memoized function
    // with last know arguments and parse it with new theme and mini runtime
    if (unistyle->type == core::UnistyleType::DynamicFunction && metadata.has_value()) {
        auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);

        // convert arguments to jsi::Value
        auto dynamicFunctionMetadata = metadata.value();
        std::vector<jsi::Value> args{};

        args.reserve(dynamicFunctionMetadata.size());

        for (int i = 0; i < dynamicFunctionMetadata.size(); i++) {
            folly::dynamic& arg = dynamicFunctionMetadata.at(i);

            args.emplace_back(jsi::valueFromDynamic(rt, arg));
        }

        const jsi::Value *argStart = args.data();

        // call cached function with memoized arguments
        auto functionResult = unistyleFn->rawValue
            .asFunction(rt)
            .call(rt, argStart, dynamicFunctionMetadata.size())
            .asObject(rt);

        unistyleFn->unprocessedValue = std::move(functionResult);
        unistyleFn->parsedStyle = this->parseFirstLevel(rt, unistyleFn, variants);
    }

    if (unistyle->isDirty) {
        unistyle->isDirty = false;
    }
}

// convert dependency map to shadow tree updates
void parser::Parser::rebuildShadowLeafUpdates(jsi::Runtime& rt, core::DependencyMap& dependencyMap) {
    auto& registry = core::UnistylesRegistry::get();

    registry.trafficController.withLock([this, &rt, &dependencyMap, &registry]() {
        shadow::ShadowLeafUpdates updates;
        updates.reserve(dependencyMap.size());

        for (const auto& [shadowNode, unistyles] : dependencyMap) {
            // Parse string colors (e.g., "#000000") to int representation
            auto rawProps = this->parseStylesToShadowTreeStyles(rt, unistyles);

            updates.emplace(shadowNode, std::move(rawProps));
        }

        registry.trafficController.setUpdates(updates);
        registry.trafficController.resumeUnistylesTraffic();
    });
}


// first level of StyleSheet, we can expect here different properties than on second level
// eg. variants, compoundVariants, mq, breakpoints etc.
jsi::Object parser::Parser::parseFirstLevel(jsi::Runtime& rt, Unistyle::Shared unistyle, std::optional<Variants> variants) {
    // for objects - we simply operate on them
    // for functions we need to work on the unprocessed result (object)
    auto& style = unistyle->type == core::UnistyleType::Object
        ? unistyle->rawValue
        : std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle)->unprocessedValue.value();
    auto parsedStyle = jsi::Object(rt);

    // we need to be sure that compoundVariants are parsed after variants and after every other style
    bool shouldParseVariants = style.hasProperty(rt, "variants");
    bool shouldParseCompoundVariants = style.hasProperty(rt, "compoundVariants") && shouldParseVariants;

    helpers::enumerateJSIObject(rt, style, [&](const std::string& propertyName, jsi::Value& propertyValue){
        // parse dependencies only once
        if (propertyName == helpers::STYLE_DEPENDENCIES && !unistyle->isSealed()) {
            auto newDeps = this->parseDependencies(rt, propertyValue.asObject(rt));

            unistyle->dependencies.insert(unistyle->dependencies.end(), newDeps.begin(), newDeps.end());

            return;
        }

        if (propertyName == helpers::STYLE_DEPENDENCIES && !unistyle->dependencies.empty()) {
            return;
        }

        // ignore web styles
        if (propertyName == helpers::WEB_STYLE_KEY) {
            return;
        }

        // special case as we need to convert it to jsi::Array<jsi::Object>
        if (propertyName == "boxShadow" && propertyValue.isString()) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseBoxShadowString(rt, propertyValue.asString(rt).utf8(rt)));

            return;
        }

        // primitives
        if (propertyValue.isNumber() || propertyValue.isString() || propertyValue.isUndefined() || propertyValue.isNull()) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

            return;
        }

        // at this point ignore non objects
        if (!propertyValue.isObject()) {
            return;
        }

        auto propertyValueObject = propertyValue.asObject(rt);

        // also, ignore any functions at this level
        if (propertyValueObject.isFunction(rt)) {
            return;
        }

        // variants and compoundVariants are computed soon after all styles
        if (propertyName == "variants" || propertyName == "compoundVariants") {
            return;
        }

        if (propertyName == "transform" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseTransforms(rt, unistyle, propertyValueObject));

            return;
        }

        if (propertyName == "boxShadow" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseBoxShadow(rt, unistyle, propertyValueObject));

            return;
        }

        if (propertyName == "filter" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseFilters(rt, unistyle, propertyValueObject));

            return;
        }

        if (propertyName == "fontVariant" && propertyValueObject.isArray(rt)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValue);

            return;
        }

        if (propertyName == "shadowOffset" || propertyName == "textShadowOffset") {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), this->parseSecondLevel(rt, unistyle, propertyValue));

            return;
        }

        if (helpers::isPlatformColor(rt, propertyValueObject)) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), propertyValueObject);

            return;
        }

        // 'mq' or 'breakpoints'
        auto valueFromBreakpoint = getValueFromBreakpoints(rt, unistyle, propertyValueObject);

        parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), this->parseSecondLevel(rt, unistyle, valueFromBreakpoint));
    });

    if (shouldParseVariants && variants.has_value()) {
        auto propertyValueObject = style.getProperty(rt, "variants").asObject(rt);
        auto parsedVariant = this->parseVariants(rt, unistyle, propertyValueObject, variants.value());

        helpers::mergeJSIObjects(rt, parsedStyle, parsedVariant);

        if (shouldParseCompoundVariants) {
            auto compoundVariants = style.getProperty(rt, "compoundVariants").asObject(rt);
            auto parsedCompoundVariants = this->parseCompoundVariants(rt, unistyle, compoundVariants, variants.value());

            helpers::mergeJSIObjects(rt, parsedStyle, parsedCompoundVariants);
        }
    }

    return parsedStyle;
}

// function replaces original user dynamic function with additional logic to memoize arguments
jsi::Function parser::Parser::createDynamicFunctionProxy(jsi::Runtime& rt, Unistyle::Shared unistyle) {
    auto unistylesRuntime = this->_unistylesRuntime;

    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forUtf8(rt, unistyle->styleKey),
        1,
        [this, unistylesRuntime, unistyle](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            auto thisObject = thisVal.isObject()
                ? thisVal.asObject(rt)
                : jsi::Object(rt);
            auto parser = parser::Parser(unistylesRuntime);
            // call user function
            auto result = unistyle->rawValue.asFunction(rt).call(rt, args, count);

            // memoize metadata to call it later
            auto unistyleFn = std::dynamic_pointer_cast<UnistyleDynamicFunction>(unistyle);

            unistyleFn->unprocessedValue = jsi::Value(rt, result).asObject(rt);

            jsi::Value rawVariants = thisObject.hasProperty(rt, helpers::STYLESHEET_VARIANTS.c_str())
                ? thisObject.getProperty(rt, helpers::STYLESHEET_VARIANTS.c_str())
                : jsi::Object(rt);

            Variants variants = helpers::variantsToPairs(rt, rawVariants.asObject(rt));

            unistyleFn->parsedStyle = parser.parseFirstLevel(rt, unistyleFn, variants);
            unistyleFn->seal();

            // for compatibility purpose save last arguments to style instance. It will work ok, if user sees warning about multiple unistyles
            helpers::defineHiddenProperty(rt, thisObject, helpers::ARGUMENTS.c_str() + std::string("_") + unistyleFn->styleKey, helpers::functionArgumentsToArray(rt, args, count));

            return core::objectFromUnistyle(rt, unistylesRuntime, unistyle, variants, std::make_optional<jsi::Array>(helpers::functionArgumentsToArray(rt, args, count))).asObject(rt);
    });
}

// function converts babel generated dependencies to C++ dependencies
std::vector<UnistyleDependency> parser::Parser::parseDependencies(jsi::Runtime &rt, jsi::Object&& dependencies) {
    helpers::assertThat(rt, dependencies.isArray(rt), "Unistyles: Babel transform is invalid - unexpected type for dependencies.");

    std::vector<UnistyleDependency> parsedDependencies{};

    parsedDependencies.reserve(5);

    helpers::iterateJSIArray(rt, dependencies.asArray(rt), [&](size_t i, jsi::Value& value){
        auto dependency = static_cast<UnistyleDependency>(value.asNumber());

        parsedDependencies.push_back(dependency);
    });

    return parsedDependencies;
}

// eg. [{ scale: 2 }, { translateX: 100 }]
jsi::Value parser::Parser::parseTransforms(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj) {
    std::vector<jsi::Value> parsedTransforms{};

    parsedTransforms.reserve(2);

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto parsedResult = this->parseSecondLevel(rt, unistyle, value);

        helpers::enumerateJSIObject(rt, parsedResult.asObject(rt), [&](const std::string& propertyName, jsi::Value& propertyValue){
            // we shouldn't allow undefined in transforms, simply remove entire object from array
            if (!propertyValue.isUndefined()) {
                parsedTransforms.emplace_back(std::move(parsedResult));
            }
        });
    });

    // create jsi::Array result with correct transforms
    jsi::Array result = jsi::Array(rt, parsedTransforms.size());

    for (size_t i = 0; i < parsedTransforms.size(); i++) {
        result.setValueAtIndex(rt, i, parsedTransforms[i]);
    }

    return result;
}

// eg [{offsetX: 5, offsetY: 5, blurRadius: 5, spreadDistance: 0, color: ‘rgba(255, 0, 0, 0.5)’}]
jsi::Value parser::Parser::parseBoxShadow(jsi::Runtime &rt, Unistyle::Shared unistyle, jsi::Object &obj) {
    std::vector<jsi::Value> parsedBoxShadows{};

    parsedBoxShadows.reserve(1);

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto parsedResult = this->parseSecondLevel(rt, unistyle, value);

        parsedBoxShadows.emplace_back(std::move(parsedResult));
    });

    // create jsi::Array result with correct box shadows
    jsi::Array result = jsi::Array(rt, parsedBoxShadows.size());

    for (size_t i = 0; i < parsedBoxShadows.size(); i++) {
        result.setValueAtIndex(rt, i, parsedBoxShadows[i]);
    }

    return result;
}

jsi::Array parser::Parser::parseBoxShadowString(jsi::Runtime& rt, std::string&& boxShadowString) {
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);

    return state.parseBoxShadowString(std::move(boxShadowString));
}

// eg. [{ brightness: 0.5 }, { opacity: 0.25 }]
jsi::Value parser::Parser::parseFilters(jsi::Runtime &rt, Unistyle::Shared unistyle, jsi::Object &obj) {
    std::vector<jsi::Value> parsedFilters{};

    parsedFilters.reserve(2);

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto parsedResult = this->parseSecondLevel(rt, unistyle, value);

        // take only one filter per object
        jsi::Array propertyNames = parsedResult.asObject(rt).getPropertyNames(rt);
        size_t length = propertyNames.size(rt);

        // ignore no filters
        if (length == 0) {
            return;
        }

        parsedFilters.emplace_back(std::move(parsedResult));
    });

    // create jsi::Array result with correct filters
    jsi::Array result = jsi::Array(rt, parsedFilters.size());

    for (size_t i = 0; i < parsedFilters.size(); i++) {
        result.setValueAtIndex(rt, i, parsedFilters[i]);
    }

    return result;
}

// find value based on breakpoints and mq
jsi::Value parser::Parser::getValueFromBreakpoints(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj) {
    auto& registry = core::UnistylesRegistry::get();
    auto& state = registry.getState(rt);

    auto sortedBreakpoints = state.getSortedBreakpointPairs();
    auto hasBreakpoints = !sortedBreakpoints.empty();
    auto currentBreakpoint = state.getCurrentBreakpointName();
    auto rawDimensions = this->_unistylesRuntime->getScreen();
    auto pixelRatio = this->_unistylesRuntime->getPixelRatio();
    auto dimensions = registry.shouldUsePointsForBreakpoints
        ? Dimensions(rawDimensions.width / pixelRatio, rawDimensions.height / pixelRatio)
        : rawDimensions;
    auto currentOrientation = dimensions.width > dimensions.height
        ? "landscape"
        : "portrait";

    jsi::Array propertyNames = obj.getPropertyNames(rt);
    size_t length = propertyNames.size(rt);

    // mq has the biggest priority, so check if first
    for (size_t i = 0; i < length; i++) {
        auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
        auto propertyValue = obj.getProperty(rt, propertyName.c_str());
        auto mq = core::UnistylesMQ{propertyName};

        if (mq.isMQ()) {
            unistyle->addDependency(UnistyleDependency::BREAKPOINTS);
        }

        if (mq.isWithinTheWidthAndHeight(dimensions)) {
            // we have direct hit
            return propertyValue;
        }
    }

    // check orientation breakpoints if user didn't register own breakpoint
    bool hasOrientationBreakpoint = obj.hasProperty(rt, currentOrientation);

    if (hasOrientationBreakpoint) {
        unistyle->addDependency(UnistyleDependency::BREAKPOINTS);
    }

    if (!hasBreakpoints && hasOrientationBreakpoint) {
        return obj.getProperty(rt, currentOrientation);
    }

    if (!currentBreakpoint.has_value()) {
        return jsi::Value::undefined();
    }

    unistyle->addDependency(UnistyleDependency::BREAKPOINTS);

    // if you're still here it means that there is no
    // matching mq nor default breakpoint, let's find the user defined breakpoint
    auto currentBreakpointIt = std::find_if(
        sortedBreakpoints.rbegin(),
        sortedBreakpoints.rend(),
        [&currentBreakpoint](const std::pair<std::string, double>& breakpoint){
            return breakpoint.first == currentBreakpoint.value();
        }
    );

    // look for any hit in reversed vector
    for (auto it = currentBreakpointIt; it != sortedBreakpoints.rend(); ++it) {
        auto breakpoint = it->first.c_str();

        if (obj.hasProperty(rt, breakpoint)) {
            return obj.getProperty(rt, breakpoint);
        }
    }

    // at this point we have no match, return undefined
    return jsi::Value::undefined();
}

// parse all types of variants
jsi::Object parser::Parser::parseVariants(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj, Variants& variants) {
    jsi::Object parsedVariant = jsi::Object(rt);
    jsi::Array propertyNames = obj.getPropertyNames(rt);

    helpers::enumerateJSIObject(rt, obj, [&](const std::string& groupName, jsi::Value& groupValue) {
        // try to match groupName to selected variants
        auto it = std::find_if(
            variants.cbegin(),
            variants.cend(),
            [&groupName](auto& variant){
                return variant.first == groupName;
            }
        );

        auto selectedVariant = it != variants.end()
            ? std::make_optional(it->second)
            : std::nullopt;

        // we've got a match, but we need to check some condition
        auto styles = this->getStylesForVariant(rt, groupName, groupValue.asObject(rt), selectedVariant, variants);

        // oops, invalid variant
        if (styles.isUndefined() || !styles.isObject()) {
            return;
        }

        auto parsedNestedStyles = this->parseSecondLevel(rt, unistyle, styles).asObject(rt);

        helpers::mergeJSIObjects(rt, parsedVariant, parsedNestedStyles);
    });

    return parsedVariant;
}

// helpers function to support 'default' variants
jsi::Value parser::Parser::getStylesForVariant(jsi::Runtime& rt, const std::string groupName, jsi::Object&& groupValue, std::optional<std::string> selectedVariant, Variants& variants) {
    // if there is no value, let's try 'default'
    auto selectedVariantKey = selectedVariant.has_value()
        ? selectedVariant.value().c_str()
        : "default";
    auto hasKey = groupValue.hasProperty(rt, selectedVariantKey);

    if (!hasKey || !selectedVariant.has_value()) {
        // for no key, add 'default' selection to variants map
        variants.emplace_back(groupName, selectedVariantKey);
    }

    if (hasKey) {
        return groupValue.getProperty(rt, selectedVariantKey);
    }

    return jsi::Value::undefined();
}

// get styles from compound variants based on selected variants
jsi::Object parser::Parser::parseCompoundVariants(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Object& obj, Variants& variants) {
    if (!obj.isArray(rt)) {
        return jsi::Object(rt);
    }

    jsi::Object parsedCompoundVariants = jsi::Object(rt);

    helpers::iterateJSIArray(rt, obj.asArray(rt), [&](size_t i, jsi::Value& value){
        if (!value.isObject()) {
            return;
        }

        auto valueObject = value.asObject(rt);

        // check if every condition for given compound variant is met
        if (this->shouldApplyCompoundVariants(rt, variants, valueObject)) {
            auto styles = valueObject.getProperty(rt, "styles");
            auto parsedNestedStyles = this->parseSecondLevel(rt, unistyle, styles).asObject(rt);

            unistyles::helpers::mergeJSIObjects(rt, parsedCompoundVariants, parsedNestedStyles);
        }
    });

    return parsedCompoundVariants;
}

// check every condition in compound variants, supports boolean variants
bool parser::Parser::shouldApplyCompoundVariants(jsi::Runtime& rt, const Variants& variants, jsi::Object& compoundVariant) {
    if (variants.empty()) {
        return false;
    }

    for (auto it = variants.cbegin(); it != variants.cend(); ++it) {
        auto variantKey = it->first;
        auto variantValue = it->second;

        if (!compoundVariant.hasProperty(rt, variantKey.c_str())) {
            continue;
        }

        auto property = compoundVariant.getProperty(rt, variantKey.c_str());
        auto propertyName = property.isBool()
            ? (property.asBool() ? "true" : "false")
            : property.isString()
                ? property.asString(rt).utf8(rt)
                : "";

        if (propertyName != variantValue) {
            return false;
        }
    }

    return true;
}

// second level of parser
// we expect here only primitives, arrays and objects
jsi::Value parser::Parser::parseSecondLevel(jsi::Runtime &rt, Unistyle::Shared unistyle, jsi::Value& nestedStyle) {
    // primitives
    if (nestedStyle.isString() || nestedStyle.isNumber() || nestedStyle.isUndefined() || nestedStyle.isNull()) {
        return jsi::Value(rt, nestedStyle);
    }

    // ignore any non objects at this level
    if (!nestedStyle.isObject()) {
        return jsi::Value::undefined();
    }

    auto nestedObjectStyle = nestedStyle.asObject(rt);

    // too deep to accept any functions or arrays
    if (nestedObjectStyle.isArray(rt) || nestedObjectStyle.isFunction(rt)) {
        return jsi::Value::undefined();
    }

    if (helpers::isPlatformColor(rt, nestedObjectStyle)) {
        return jsi::Value(rt, nestedStyle);
    }

    jsi::Object parsedStyle = jsi::Object(rt);

    helpers::enumerateJSIObject(rt, nestedObjectStyle, [&](const std::string& propertyName, jsi::Value& propertyValue){
        // special case as we need to convert it to jsi::Array<jsi::Object>
        // possible with variants and compoundVariants
        if (propertyName == "boxShadow" && propertyValue.isString()) {
            parsedStyle.setProperty(rt, jsi::PropNameID::forUtf8(rt, propertyName), parseBoxShadowString(rt, propertyValue.asString(rt).utf8(rt)));

            return;
        }

        // primitives, bool is possible for boxShadow inset
        if (propertyValue.isString() || propertyValue.isNumber() || propertyValue.isUndefined() || propertyValue.isNull() || propertyValue.isBool()) {
            parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);

            return;
        }

        // ignore any non objects at this level
        if (!propertyValue.isObject()) {
            parsedStyle.setProperty(rt, propertyName.c_str(), jsi::Value::undefined());

            return;
        }

        auto nestedObjectStyle = propertyValue.asObject(rt);

        if (nestedObjectStyle.isFunction(rt)) {
            parsedStyle.setProperty(rt, propertyName.c_str(), jsi::Value::undefined());

            return;
        }

        auto isArray = nestedObjectStyle.isArray(rt);

        if (!isArray) {
            parsedStyle.setProperty(rt, propertyName.c_str(), this->getValueFromBreakpoints(rt, unistyle, nestedObjectStyle));
        }

        // possible with variants and compoundVariants
        if (propertyName == "transform") {
            parsedStyle.setProperty(rt, propertyName.c_str(), parseTransforms(rt, unistyle, nestedObjectStyle));

            return;
        }

        if (propertyName == "boxShadow") {
            parsedStyle.setProperty(rt, propertyName.c_str(), parseBoxShadow(rt, unistyle, nestedObjectStyle));

            return;
        }

        if (propertyName == "filter") {
            parsedStyle.setProperty(rt, propertyName.c_str(), parseFilters(rt, unistyle, nestedObjectStyle));

            return;
        }

        if (propertyName == "fontVariant") {
            parsedStyle.setProperty(rt, propertyName.c_str(), propertyValue);

            return;
        }

        if (propertyName == "shadowOffset" || propertyName == "textShadowOffset") {
            parsedStyle.setProperty(rt, propertyName.c_str(), this->parseSecondLevel(rt, unistyle, propertyValue));

            return;
        }
    });

    return parsedStyle;
}

// convert unistyles to folly with int colors
folly::dynamic parser::Parser::parseStylesToShadowTreeStyles(jsi::Runtime& rt, const std::vector<std::shared_ptr<UnistyleData>>& unistyles) {
    jsi::Object convertedStyles(rt);
    auto& state = core::UnistylesRegistry::get().getState(rt);

    for (const auto& unistyleData : unistyles) {
        if (!unistyleData->parsedStyle.has_value()) {
            continue;
        }

        helpers::enumerateJSIObject(
            rt,
            unistyleData->parsedStyle.value(),
            [this, &rt, &state, &convertedStyles](const std::string& propertyName, jsi::Value& propertyValue) {
                if (this->isColor(propertyName)) {
                    convertedStyles.setProperty(
                        rt,
                        propertyName.c_str(),
                        jsi::Value(state.parseColor(propertyValue))
                    );

                    return;
                }

                if (!propertyValue.isObject()) {
                    convertedStyles.setProperty(
                        rt,
                        propertyName.c_str(),
                        propertyValue
                    );

                    return;
                }

                jsi::Object objValue = propertyValue.asObject(rt);

                if (!objValue.isArray(rt)) {
                    convertedStyles.setProperty(
                        rt,
                        propertyName.c_str(),
                        propertyValue
                    );

                    return;
                }

                // parse nested arrays like boxShadow
                jsi::Array arrValue = objValue.asArray(rt);
                size_t arrLen = arrValue.length(rt);
                jsi::Array parsedArray(rt, arrLen);

                helpers::iterateJSIArray(
                    rt,
                    arrValue,
                    [this, &rt, &state, &propertyName, &parsedArray](size_t i, jsi::Value& nestedValue) {
                        if (nestedValue.isObject()) {
                            jsi::Object obj(rt);

                            helpers::enumerateJSIObject(
                                rt,
                                nestedValue.asObject(rt),
                                [this, &rt, &state, &obj](const std::string& nestedPropName, jsi::Value& nestedPropValue) {
                                    if (this->isColor(nestedPropName)) {
                                        obj.setProperty(
                                            rt,
                                            nestedPropName.c_str(),
                                            state.parseColor(nestedPropValue)
                                        );
                                    } else {
                                        obj.setProperty(
                                            rt,
                                            nestedPropName.c_str(),
                                            nestedPropValue
                                        );
                                    }
                                }
                            );

                            parsedArray.setValueAtIndex(rt, i, obj);

                            return;
                        }

                        if (this->isColor(propertyName)) {
                            parsedArray.setValueAtIndex(
                                rt,
                                i,
                                jsi::Value(state.parseColor(nestedValue))
                            );
                        } else {
                            parsedArray.setValueAtIndex(rt, i, nestedValue);
                        }
                    }
                );

                convertedStyles.setProperty(rt, propertyName.c_str(), parsedArray);
            }
        );
    }

    return jsi::dynamicFromValue(rt, jsi::Value(rt, convertedStyles));
}


// check is styleKey contains color
bool parser::Parser::isColor(const std::string& propertyName) {
    std::string str = propertyName;
    std::transform(str.begin(), str.end(), str.begin(), ::tolower);

    return str.find("color") != std::string::npos;
}
