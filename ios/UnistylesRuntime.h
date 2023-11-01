#pragma once

#import "UnistylesModule.h"
#import <jsi/jsi.h>
#import <vector>

using namespace facebook;

class JSI_EXPORT UnistylesRuntime : public jsi::HostObject {
    UnistylesEventHandler eventHandler;
    ScreenWidth getScreenWidth;

public:
    UnistylesRuntime(UnistylesEventHandler handler, ScreenWidth getScreenWidth) :
    eventHandler(handler), getScreenWidth(getScreenWidth) {}

    std::string theme;
    std::string breakpoint;
    std::string colorScheme;
    std::vector<std::string> featureFlags;
    std::vector<std::pair<std::string, double>> sortedBreakpointEntries;

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
    std::string getBreakpointFromScreenWidth(double width, const std::vector<std::pair<std::string, double>>& sortedBreakpointEntries);
};
