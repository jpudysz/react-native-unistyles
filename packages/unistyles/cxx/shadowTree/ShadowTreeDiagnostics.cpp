#include "ShadowTreeDiagnostics.h"

#include <array>
#include <cstdio>
#include <folly/Conv.h>
#include <react/renderer/components/image/ImageProps.h>
// ParagraphProps is platform specific and not exposed by the Android prefab
#if __has_include(<react/renderer/components/text/BaseParagraphProps.h>)
#include <react/renderer/components/text/BaseParagraphProps.h>
#define UNISTYLES_HAS_BASE_PARAGRAPH_PROPS 1
#else
#define UNISTYLES_HAS_BASE_PARAGRAPH_PROPS 0
#endif
#include <react/renderer/components/text/TextProps.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <string_view>
#include "Parser.h"
#include "UnistylesRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

namespace {

struct PropDifference {
    std::string prop;
    std::string expected;
    std::string actual;
};

struct Mismatch {
    Tag tag;
    std::string component;
    std::string styleKey;
    PropDifference difference;
};

template <typename P>
using VerifiedProps = std::vector<std::pair<const char*, std::string (*)(const P&)>>;

// SharedColor::toString exists since React Native 0.83, same format
std::string serialize(const SharedColor& color) {
    if (!color) {
        return "undefined";
    }

    auto components = colorComponentsFromColor(color);
    std::array<char, 64> buffer{};

    std::snprintf(
        buffer.data(),
        buffer.size(),
        "rgba(%.0f, %.0f, %.0f, %g)",
        components.red * 255.f,
        components.green * 255.f,
        components.blue * 255.f,
        components.alpha
    );

    return buffer.data();
}

// ImageProps::tintColor is optional since React Native 0.88, unused before
[[maybe_unused]] std::string serialize(const std::optional<SharedColor>& color) {
    return color ? serialize(*color) : "undefined";
}

std::string serialize(Float value) {
    return folly::to<std::string>(value);
}

std::string serialize(const std::optional<FontWeight>& fontWeight) {
    return fontWeight ? std::to_string(static_cast<int>(*fontWeight)) : "undefined";
}

RectangleEdges<SharedColor> borderColors(const BaseViewProps& props) {
    return props.borderColors.resolve(false, {});
}

// theme dependent props, add new ones here
const VerifiedProps<BaseViewProps> viewProps{
    {"backgroundColor", [](const BaseViewProps& props) { return serialize(props.backgroundColor); }},
    {"borderLeftColor", [](const BaseViewProps& props) { return serialize(borderColors(props).left); }},
    {"borderTopColor", [](const BaseViewProps& props) { return serialize(borderColors(props).top); }},
    {"borderRightColor", [](const BaseViewProps& props) { return serialize(borderColors(props).right); }},
    {"borderBottomColor", [](const BaseViewProps& props) { return serialize(borderColors(props).bottom); }},
    {"opacity", [](const BaseViewProps& props) { return serialize(props.opacity); }},
    {"shadowColor", [](const BaseViewProps& props) { return serialize(props.shadowColor); }},
};

const VerifiedProps<BaseTextProps> textProps{
    {"color", [](const BaseTextProps& props) { return serialize(props.textAttributes.foregroundColor); }},
    {"textBackgroundColor", [](const BaseTextProps& props) { return serialize(props.textAttributes.backgroundColor); }},
    {"fontSize", [](const BaseTextProps& props) { return serialize(props.textAttributes.fontSize); }},
    {"fontWeight", [](const BaseTextProps& props) { return serialize(props.textAttributes.fontWeight); }},
    {"textDecorationColor", [](const BaseTextProps& props) { return serialize(props.textAttributes.textDecorationColor); }},
};

const VerifiedProps<ImageProps> imageProps{
    {"tintColor", [](const ImageProps& props) { return serialize(props.tintColor); }},
};

template <typename P>
void diff(const VerifiedProps<P>& verifiedProps, const P& expected, const P& actual, std::vector<PropDifference>& differences) {
    for (const auto& [name, read] : verifiedProps) {
        auto expectedValue = read(expected);
        auto actualValue = read(actual);

        if (expectedValue != actualValue) {
            differences.push_back({name, std::move(expectedValue), std::move(actualValue)});
        }
    }
}

const BaseTextProps* asTextProps(std::string_view componentName, const Props& props) {
#if UNISTYLES_HAS_BASE_PARAGRAPH_PROPS
    if (componentName == "Paragraph") {
        return &static_cast<const BaseParagraphProps&>(props);
    }
#endif

    if (componentName == "Text") {
        return &static_cast<const TextProps&>(props);
    }

    return nullptr;
}

std::vector<PropDifference> diffVerifiedProps(const ShadowNode& shadowNode, const Props& expected) {
    const auto& actual = *shadowNode.getProps();
    const std::string_view componentName = shadowNode.getComponentName();
    std::vector<PropDifference> differences;

    if (shadowNode.getTraits().check(ShadowNodeTraits::Trait::ViewKind)) {
        diff(viewProps, static_cast<const BaseViewProps&>(expected), static_cast<const BaseViewProps&>(actual), differences);
    }

    if (const auto* expectedText = asTextProps(componentName, expected)) {
        diff(textProps, *expectedText, *asTextProps(componentName, actual), differences);
    }

    if (componentName == "Image") {
        diff(imageProps, static_cast<const ImageProps&>(expected), static_cast<const ImageProps&>(actual), differences);
    }

    return differences;
}

// current revision of every surface
std::unordered_map<SurfaceId, std::shared_ptr<const RootShadowNode>> getCommittedRoots(const UIManager& uiManager) {
    std::unordered_map<SurfaceId, std::shared_ptr<const RootShadowNode>> roots;

    uiManager.getShadowTreeRegistry().enumerate([&roots](const ShadowTree& shadowTree, bool&) {
        roots.emplace(shadowTree.getSurfaceId(), shadowTree.getCurrentRevision().rootShadowNode);
    });

    return roots;
}

// nullptr when the family is not part of the committed tree
std::shared_ptr<const ShadowNode> findCommittedNode(
    const std::unordered_map<SurfaceId, std::shared_ptr<const RootShadowNode>>& roots,
    const ShadowNodeFamily& family
) {
    const auto rootIt = roots.find(family.getSurfaceId());

    if (rootIt == roots.end() || !rootIt->second) {
        return nullptr;
    }

    auto ancestors = family.getAncestors(*rootIt->second);

    if (ancestors.empty()) {
        return nullptr;
    }

    const auto& [parent, index] = ancestors.back();

    return parent.get().getChildren().at(index);
}

// rebuilds a copy of every UnistyleData, so the registry and shared parsed styles stay untouched
folly::dynamic getExpectedProps(
    jsi::Runtime& rt,
    parser::Parser& parser,
    const std::vector<std::shared_ptr<core::UnistyleData>>& unistyles
) {
    std::vector<std::shared_ptr<core::UnistyleData>> expectedUnistyles;
    // prop name -> set last by an inline style
    std::unordered_map<std::string, bool> propOwners;

    expectedUnistyles.reserve(unistyles.size());

    for (const auto& unistyleData : unistyles) {
        auto arguments = unistyleData->dynamicFunctionMetadata.value_or(std::vector<folly::dynamic>{});
        auto expectedData = std::make_shared<core::UnistyleData>(
            unistyleData->unistyle,
            unistyleData->variants,
            arguments,
            unistyleData->scopedTheme
        );

        // inline styles don't depend on the theme, React (or an animation) owns the props they set last
        if (unistyleData->unistyle->styleKey == helpers::EXOTIC_STYLE_KEY) {
            if (unistyleData->parsedStyle.has_value()) {
                helpers::enumerateJSIObject(rt, unistyleData->parsedStyle.value(), [&propOwners](const std::string& propName, jsi::Value&) {
                    propOwners[propName] = true;
                });
            }

            continue;
        }

        if (expectedData->scopedTheme.has_value()) {
            jsi::Value scopedStyleSheet = jsi::Value::undefined();

            parser.rebuildUnistyleWithScopedTheme(rt, scopedStyleSheet, expectedData);
        }

        // static StyleSheets have no scoped version
        if (!expectedData->parsedStyle.has_value()) {
            parser.rebuildUnistyleWithVariants(rt, expectedData);
        }

        if (expectedData->parsedStyle.has_value()) {
            helpers::enumerateJSIObject(rt, expectedData->parsedStyle.value(), [&propOwners](const std::string& propName, jsi::Value&) {
                propOwners[propName] = false;
            });
        }

        expectedUnistyles.emplace_back(std::move(expectedData));
    }

    auto expectedProps = parser.parseStylesToShadowTreeStyles(rt, expectedUnistyles);

    for (const auto& [propName, isOwnedByInlineStyle] : propOwners) {
        if (isOwnedByInlineStyle) {
            expectedProps.erase(propName);
        }
    }

    return expectedProps;
}

}

jsi::Value shadow::ShadowTreeDiagnostics::verify(jsi::Runtime& rt, std::shared_ptr<HybridUnistylesRuntime> unistylesRuntime) {
    auto& registry = core::UnistylesRegistry::get();
    auto& uiManager = UIManagerBinding::getBinding(rt)->getUIManager();
    auto snapshot = registry.getLinkedFamiliesSnapshot();
    auto roots = getCommittedRoots(uiManager);
    auto parser = parser::Parser(unistylesRuntime);

    double checked = 0;
    double detached = 0;
    double suspended = 0;
    double orphans = 0;
    std::vector<Mismatch> mismatches;
    std::vector<std::string> errors;

    for (const auto& linkedFamily : snapshot) {
        const auto& family = *linkedFamily.family;

        // React Native dropped it, eg. unmounted while frozen
        if (linkedFamily.isOwnedOnlyByUnistyles) {
            orphans++;

            continue;
        }

        // hidden by Suspense or a frozen screen, it gets fresh styles when restored
        if (linkedFamily.isSuspended) {
            suspended++;

            continue;
        }

        auto committed = findCommittedNode(roots, family);

        if (!committed) {
            detached++;

            continue;
        }

        checked++;

        try {
            auto expectedRawProps = getExpectedProps(rt, parser, linkedFamily.unistyles);
            PropsParserContext propsParserContext{committed->getSurfaceId(), *committed->getContextContainer()};
            auto expectedProps = committed->getComponentDescriptor().cloneProps(
                propsParserContext,
                committed->getProps(),
                RawProps(expectedRawProps)
            );

            for (auto& difference : diffVerifiedProps(*committed, *expectedProps)) {
                mismatches.push_back({
                    family.getTag(),
                    committed->getComponentName(),
                    linkedFamily.unistyles.empty() ? "" : linkedFamily.unistyles.back()->unistyle->styleKey,
                    std::move(difference)
                });
            }
        } catch (const std::exception& error) {
            errors.emplace_back("tag " + std::to_string(family.getTag()) + ": " + error.what());
        }
    }

    auto jsMismatches = jsi::Array(rt, mismatches.size());

    for (size_t i = 0; i < mismatches.size(); i++) {
        auto& mismatch = mismatches[i];
        auto jsMismatch = jsi::Object(rt);

        jsMismatch.setProperty(rt, "tag", static_cast<double>(mismatch.tag));
        jsMismatch.setProperty(rt, "component", jsi::String::createFromUtf8(rt, mismatch.component));
        jsMismatch.setProperty(rt, "styleKey", jsi::String::createFromUtf8(rt, mismatch.styleKey));
        jsMismatch.setProperty(rt, "prop", jsi::String::createFromUtf8(rt, mismatch.difference.prop));
        jsMismatch.setProperty(rt, "expected", jsi::String::createFromUtf8(rt, mismatch.difference.expected));
        jsMismatch.setProperty(rt, "actual", jsi::String::createFromUtf8(rt, mismatch.difference.actual));
        jsMismatches.setValueAtIndex(rt, i, std::move(jsMismatch));
    }

    auto jsErrors = jsi::Array(rt, errors.size());

    for (size_t i = 0; i < errors.size(); i++) {
        jsErrors.setValueAtIndex(rt, i, jsi::String::createFromUtf8(rt, errors[i]));
    }

    auto report = jsi::Object(rt);

    report.setProperty(rt, "linked", static_cast<double>(snapshot.size()));
    report.setProperty(rt, "checked", checked);
    report.setProperty(rt, "detached", detached);
    report.setProperty(rt, "suspended", suspended);
    report.setProperty(rt, "orphans", orphans);
    report.setProperty(rt, "pendingUpdates", static_cast<double>(registry.getPendingUpdatesCount()));
    report.setProperty(rt, "mismatches", std::move(jsMismatches));
    report.setProperty(rt, "errors", std::move(jsErrors));

    return report;
}
