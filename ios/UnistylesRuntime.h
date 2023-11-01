#pragma once

#import <jsi/jsi.h>
#import <vector>

using namespace facebook;

class JSI_EXPORT UnistylesRuntime : public jsi::HostObject {
public:
    std::string theme;
    std::string breakpoint;
    std::string colorScheme;
    std::vector<std::string> featureFlags;
    std::vector<std::pair<std::string, double>> sortedBreakpointEntries;

    jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
    std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
};
