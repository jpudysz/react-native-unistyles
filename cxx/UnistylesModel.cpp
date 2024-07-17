#include "UnistylesModel.h"

std::string UnistylesModel::getBreakpointFromScreenWidth(int width, const std::vector<std::pair<std::string, double>>& sortedBreakpointPairs) {
    for (size_t i = 0; i < sortedBreakpointPairs.size(); ++i) {
        const auto& [key, value] = sortedBreakpointPairs[i];
        const double maxVal = (i + 1 < sortedBreakpointPairs.size()) ? sortedBreakpointPairs[i + 1].second : std::numeric_limits<double>::infinity();

        if (width >= value && width < maxVal) {
            return key;
        }
    }

    return sortedBreakpointPairs.empty() ? "" : sortedBreakpointPairs.back().first;
}

void UnistylesModel::handleScreenSizeChange(Screen& screen, std::optional<Insets> insets, std::optional<Dimensions> statusBar, std::optional<Dimensions> navigationBar) {
    std::string breakpoint = this->getBreakpointFromScreenWidth(screen.width, this->sortedBreakpointPairs);
    bool hasDifferentBreakpoint = this->breakpoint != breakpoint;
    bool hasDifferentScreenDimensions = this->screen.width != screen.width || this->screen.height != screen.height;
    bool hasDifferentPixelRatio = this->pixelRatio != screen.pixelRatio;
    bool hasDifferentFontScale = this->fontScale != screen.fontScale;
    bool hasDifferentInsets = insets.has_value()
        ? this->insets.top != insets->top || this->insets.bottom != insets->bottom || this->insets.left != insets->left || this->insets.right != insets->right
        : false;

    // we don't need to check statusBar/navigationBar as they will only change on orientation change witch is equal to hasDifferentScreenDimensions
    bool shouldNotify = hasDifferentBreakpoint || hasDifferentScreenDimensions || hasDifferentInsets || hasDifferentPixelRatio || hasDifferentFontScale;

    this->breakpoint = breakpoint;
    this->screen = {screen.width, screen.height};
    this->pixelRatio = screen.pixelRatio;
    this->fontScale = screen.fontScale;

    if (insets.has_value()) {
        this->insets = {insets->top, insets->bottom, insets->left, insets->right};
    }

    if (statusBar.has_value()) {
        this->statusBar = {statusBar->width, statusBar->height};
    }

    if (navigationBar.has_value()) {
        this->navigationBar = {navigationBar->width, navigationBar->height};
    }

    if (shouldNotify) {
        this->onLayoutChange();
    }
}

void UnistylesModel::handleAppearanceChange(std::string colorScheme) {
    this->colorScheme = colorScheme;

    if (!this->supportsAutomaticColorScheme || !this->hasAdaptiveThemes) {
        return;
    }

    if (this->themeName != this->colorScheme) {
        this->onThemeChange(this->colorScheme);
        this->themeName = this->colorScheme;
    }
}

void UnistylesModel::handleContentSizeCategoryChange(std::string contentSizeCategory) {
    if (this->contentSizeCategory == contentSizeCategory) {
        return;
    }

    this->contentSizeCategory = contentSizeCategory;
}

jsi::Value UnistylesModel::getThemeOrFail(jsi::Runtime& runtime) {
    if (this->themes.size() == 1) {
        std::string themeName = this->themes.at(0);

        this->themeName = themeName;

        return jsi::String::createFromUtf8(runtime, themeName);
    }

    return jsi::Value().undefined();
}

std::vector<std::pair<std::string, double>> UnistylesModel::toSortedBreakpointPairs(jsi::Runtime& rt, jsi::Object& breakpointsObj) {
    jsi::Array propertyNames = breakpointsObj.getPropertyNames(rt);
    std::vector<std::pair<std::string, double>> sortedBreakpointEntriesVec;

    for (size_t i = 0; i < propertyNames.size(rt); ++i) {
        jsi::Value propNameValue = propertyNames.getValueAtIndex(rt, i);
        std::string name = propNameValue.asString(rt).utf8(rt);
        jsi::PropNameID propNameID = jsi::PropNameID::forUtf8(rt, name);
        jsi::Value value = breakpointsObj.getProperty(rt, propNameID);

        if (value.isNumber()) {
            double breakpointValue = value.asNumber();

            sortedBreakpointEntriesVec.push_back(std::make_pair(name, breakpointValue));
        }
    }

    std::sort(sortedBreakpointEntriesVec.begin(), sortedBreakpointEntriesVec.end(), [](const std::pair<std::string, double>& a, const std::pair<std::string, double>& b) {
        return a.second < b.second;
    });

    return sortedBreakpointEntriesVec;
}

// a little bit hacky, but works like Turbo Module emitDeviceEvent
// it will be super easy to refactor for Unistyles 3.0
// ref: https://github.com/facebook/react-native/pull/43375
// ref: https://github.com/facebook/react-native/blob/b5fd041917d197f256433a41a126f0dff767c429/packages/react-native/ReactCommon/react/nativemodule/core/ReactCommon/TurboModule.cpp#L42
void UnistylesModel::emitDeviceEvent(const std::string eventType, EventPayload payload) {
    this->callInvoker->invokeAsync([eventType, payload, this](){
        jsi::Value emitter = this->runtime.global().getProperty(this->runtime, "__rctDeviceEventEmitter");

        if (emitter.isUndefined()) {
            return;
        }

        jsi::Object emitterObject = emitter.asObject(runtime);
        jsi::Function emitFunction = emitterObject.getPropertyAsFunction(runtime, "emit");

        std::vector<jsi::Value> arguments;
        jsi::Object event = jsi::Object(this->runtime);

        event.setProperty(this->runtime, "type", jsi::String::createFromUtf8(this->runtime, eventType));

        jsi::Object eventPayload = this->parseEventPayload(payload);

        event.setProperty(this->runtime, "payload", eventPayload);

        arguments.emplace_back(jsi::String::createFromAscii(runtime, "__unistylesOnChange"));
        arguments.emplace_back(std::move(event));

        emitFunction.callWithThis(runtime, emitterObject, (const jsi::Value*)arguments.data(), arguments.size());
    });
}

void UnistylesModel::onThemeChange(std::string themeName) {
    EventPayload payload;
    payload["themeName"] = themeName;

    this->emitDeviceEvent("theme", payload);
}

void UnistylesModel::onPluginChange() {
    this->emitDeviceEvent("plugin", {});
}

void UnistylesModel::onLayoutChange() {
    EventPayload payload;
    std::string orientation = screen.width > screen.height
        ? UnistylesOrientationLandscape
        : UnistylesOrientationPortrait;

    payload["breakpoint"] = this->breakpoint;
    payload["orientation"] = orientation;

    EventNestedValue screenPayload;
    auto screen = this->screen;

    screenPayload["width"] = screen.width;
    screenPayload["height"] = screen.height;

    payload["screen"] = screenPayload;

    EventNestedValue statusBarPayload;
    auto statusBar = this->statusBar;

    statusBarPayload["width"] = statusBar.width;
    statusBarPayload["height"] = statusBar.height;

    payload["statusBar"] = statusBarPayload;

    EventNestedValue navigationBarPayload;
    auto navigationBar = this->navigationBar;

    navigationBarPayload["width"] = navigationBar.width;
    navigationBarPayload["height"] = navigationBar.height;

    payload["navigationBar"] = navigationBarPayload;

    EventNestedValue insetsPayload;
    auto insets = this->insets;

    insetsPayload["top"] = insets.top;
    insetsPayload["bottom"] = insets.bottom;
    insetsPayload["left"] = insets.left;
    insetsPayload["right"] = insets.right;

    payload["insets"] = insetsPayload;

    this->emitDeviceEvent("layout", payload);
}

jsi::Object UnistylesModel::parseEventPayload(EventPayload payload) {
    jsi::Object eventPayload = jsi::Object(this->runtime);

    for (const auto& [key, value] : payload) {
        if (std::holds_alternative<std::string>(value)) {
            eventPayload.setProperty(this->runtime, key.c_str(), jsi::String::createFromUtf8(this->runtime, std::get<std::string>(value)));
        }

        if (std::holds_alternative<int>(value)) {
            eventPayload.setProperty(this->runtime, key.c_str(), std::get<int>(value));
        }

        if (std::holds_alternative<EventNestedValue>(value)) {
            eventPayload.setProperty(this->runtime, key.c_str(), this->parseEventNestedPayload(std::get<EventNestedValue>(value)));
        }
    }

    return eventPayload;
}

jsi::Object UnistylesModel::parseEventNestedPayload(EventNestedValue payload) {
    jsi::Object eventPayload = jsi::Object(this->runtime);

    for (const auto& [key, value] : payload) {
        if (std::holds_alternative<std::string>(value)) {
            eventPayload.setProperty(this->runtime, key.c_str(), jsi::String::createFromUtf8(this->runtime, std::get<std::string>(value)));
        }

        if (std::holds_alternative<int>(value)) {
            eventPayload.setProperty(this->runtime, key.c_str(), std::get<int>(value));
        }
    }

    return eventPayload;
}
