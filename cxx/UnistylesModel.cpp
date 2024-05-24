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

void UnistylesModel::handleScreenSizeChange(Dimensions& screen, Insets& insets, Dimensions& statusBar, Dimensions& navigationBar) {
    std::string breakpoint = this->getBreakpointFromScreenWidth(screen.width, this->sortedBreakpointPairs);
    bool hasDifferentBreakpoint = this->breakpoint != breakpoint;
    bool hasDifferentScreenDimensions = this->screen.width != screen.width || this->screen.height != screen.height;
    bool hasDifferentInsets = this->insets.top != insets.top || this->insets.bottom != insets.bottom || this->insets.left != insets.left || this->insets.right != insets.right;

    // we don't need to check statusBar/navigationBar as they will only change on orientation change witch is equal to hasDifferentScreenDimensions
    bool shouldNotify = hasDifferentBreakpoint || hasDifferentScreenDimensions || hasDifferentInsets;

    this->breakpoint = breakpoint;
    this->screen = {screen.width, screen.height};
    this->insets = {insets.top, insets.bottom, insets.left, insets.right};
    this->statusBar = {statusBar.width, statusBar.height};
    this->navigationBar = {navigationBar.width, navigationBar.height};

    std::string orientation = screen.width > screen.height
        ? UnistylesOrientationLandscape
        : UnistylesOrientationPortrait;

    if (shouldNotify) {
        this->onLayoutChangeCallback(breakpoint, orientation, screen, statusBar, insets, navigationBar);
    }
}

void UnistylesModel::handleAppearanceChange(std::string colorScheme) {
    this->colorScheme = colorScheme;

    if (!this->supportsAutomaticColorScheme || !this->hasAdaptiveThemes) {
        return;
    }

    if (this->themeName != this->colorScheme) {
        this->onThemeChangeCallback(this->colorScheme);
        this->themeName = this->colorScheme;
    }
}

void UnistylesModel::handleContentSizeCategoryChange(std::string contentSizeCategory) {
    this->contentSizeCategory = contentSizeCategory;
    this->onContentSizeCategoryChangeCallback(contentSizeCategory);
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
