#pragma once

#include <cxxreact/ReactNativeVersion.h>
#include <string>
#include <vector>
#include "UnistyleDependency.hpp"

// Scoped slice on the "Unistyles" track of the React Native DevTools Performance panel. Extra args are
// [name, value] property pairs, evaluated even when not tracing, so keep them cheap (counts, literals)
#if REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86
#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <jsinspector-modern/tracing/PerformanceTracerSection.h>

#define UNISTYLES_TRACE_CONCAT_INNER(a, b) a##b
#define UNISTYLES_TRACE_CONCAT(a, b) UNISTYLES_TRACE_CONCAT_INNER(a, b)
#define UNISTYLES_TRACE_SECTION(name, ...)                                                                             \
    facebook::react::jsinspector_modern::tracing::PerformanceTracerSection UNISTYLES_TRACE_CONCAT(                     \
        unistylesTrace, __LINE__)(name, "Unistyles", nullptr, nullptr __VA_OPT__(, ) __VA_ARGS__)
#define UNISTYLES_IS_TRACING() facebook::react::jsinspector_modern::tracing::PerformanceTracer::getInstance().isTracing()
#else
#define UNISTYLES_TRACE_SECTION(name, ...)
#define UNISTYLES_IS_TRACING() false
#endif

namespace margelo::nitro::unistyles::helpers {

inline const char* dependencyToString(UnistyleDependency dependency) {
    switch (dependency) {
        case UnistyleDependency::THEME:
            return "theme";
        case UnistyleDependency::THEMENAME:
            return "themeName";
        case UnistyleDependency::ADAPTIVETHEMES:
            return "adaptiveThemes";
        case UnistyleDependency::BREAKPOINTS:
            return "breakpoints";
        case UnistyleDependency::VARIANTS:
            return "variants";
        case UnistyleDependency::COLORSCHEME:
            return "colorScheme";
        case UnistyleDependency::DIMENSIONS:
            return "dimensions";
        case UnistyleDependency::ORIENTATION:
            return "orientation";
        case UnistyleDependency::CONTENTSIZECATEGORY:
            return "contentSizeCategory";
        case UnistyleDependency::INSETS:
            return "insets";
        case UnistyleDependency::PIXELRATIO:
            return "pixelRatio";
        case UnistyleDependency::FONTSCALE:
            return "fontScale";
        case UnistyleDependency::STATUSBAR:
            return "statusBar";
        case UnistyleDependency::NAVIGATIONBAR:
            return "navigationBar";
        case UnistyleDependency::IME:
            return "ime";
        case UnistyleDependency::RTL:
            return "rtl";
    }

    return "unknown";
}

// built only while DevTools records, it allocates
inline std::string dependenciesToString(const std::vector<UnistyleDependency>& dependencies) {
    if (!UNISTYLES_IS_TRACING()) {
        return {};
    }

    std::string result;

    for (auto dependency : dependencies) {
        if (!result.empty()) {
            result += ", ";
        }

        result += dependencyToString(dependency);
    }

    return result;
}

}
