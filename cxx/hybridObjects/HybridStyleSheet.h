#pragma once

#include <cmath>
#include <jsi/jsi.h>
#include "HybridStyleSheetSpec.hpp"
#include "HybridUnistylesRuntime.h"
#include "HybridMiniRuntime.h"
#include "Unistyles-Swift-Cxx-Umbrella.hpp"
#include "Helpers.h"
#include "Constants.h"
#include "Breakpoints.h"
#include "StyleSheetRegistry.h"
#include "HostStyle.h"
#include "ShadowTreeManager.h"
#include "ViewUpdate.h"

using namespace margelo::nitro::unistyles;

struct HybridStyleSheet: public HybridStyleSheetSpec {
    HybridStyleSheet(
        Unistyles::HybridNativePlatformSpecCxx nativePlatform,
        std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime
    ) : HybridObject(TAG),
        unistylesRuntime{unistylesRuntime},
        nativePlatform{nativePlatform},
        miniRuntime{std::make_shared<HybridMiniRuntime>(unistylesRuntime)} {
        this->nativePlatform.registerPlatformListener(std::bind(&HybridStyleSheet::onPlatformEvent, this, std::placeholders::_1));
    }

    jsi::Value create(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);
    jsi::Value configure(jsi::Runtime& rt,
                      const jsi::Value& thisValue,
                      const jsi::Value* args,
                      size_t count);

    void loadHybridMethods() override {
        HybridStyleSheetSpec::loadHybridMethods();

        registerHybrids(this, [](Prototype& prototype) {
            prototype.registerRawHybridMethod("create", 1, &HybridStyleSheet::create);
            prototype.registerRawHybridMethod("configure", 1, &HybridStyleSheet::configure);
        });
    };

    double getHairlineWidth() override;

private:
    void parseSettings(jsi::Runtime& rt, jsi::Object settings);
    void parseBreakpoints(jsi::Runtime& rt, jsi::Object breakpoints);
    void parseThemes(jsi::Runtime& rt, jsi::Object themes);
    void verifyAndSelectTheme(jsi::Runtime &rt);
    void setThemeFromColorScheme(jsi::Runtime& rt);
    void attachMetaFunctions(jsi::Runtime& rt, core::StyleSheet& styleSheet, jsi::Object& parsedStyleSheet);
    void onPlatformEvent(PlatformEvent event);
    void updateUnistylesWithDependencies(std::vector<core::UnistyleDependency>& depdendencies);

    Unistyles::HybridNativePlatformSpecCxx nativePlatform;
    std::shared_ptr<HybridMiniRuntime> miniRuntime;
    std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime;
    core::StyleSheetRegistry styleSheetRegistry{miniRuntime};
};

