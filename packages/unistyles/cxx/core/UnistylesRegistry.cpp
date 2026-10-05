#include "UnistylesRegistry.h"
#include "UnistylesState.h"
#include "Parser.h"
#include "NativeProps.h"

using namespace margelo::nitro::unistyles;
using namespace facebook;
using namespace facebook::react;

std::atomic<int> core::UnistylesRegistry::_nextStyleSheetTag{0};

void core::UnistylesRegistry::registerTheme(jsi::Runtime& rt, uint64_t generation, std::string name, jsi::Value& theme) {
    std::lock_guard<std::mutex> lock(this->_ownershipMutex);

    if (!this->isCurrent(generation)) {
        throw std::runtime_error(helpers::RUNTIME_REPLACED_ERROR);
    }

    auto& state = this->getState();

    state._jsThemes.emplace(name, std::move(theme));
    state._registeredThemeNames.push_back(name);
}

void core::UnistylesRegistry::registerBreakpoints(std::vector<std::pair<std::string, double>>& sortedBreakpoints) {
    auto& state = this->getState();

    state._sortedBreakpointPairs = std::move(sortedBreakpoints);
}

void core::UnistylesRegistry::setPrefersAdaptiveThemes(bool prefersAdaptiveThemes) {
    auto& state = this->getState();

    state._prefersAdaptiveThemes = prefersAdaptiveThemes;
}

void core::UnistylesRegistry::setInitialThemeName(std::string themeName) {
    auto& state = this->getState();

    state._initialThemeName = themeName;
}

core::UnistylesState& core::UnistylesRegistry::getState() {
    if (!this->_state) {
        throw std::runtime_error("Unistyles was loaded, but it's not configured. Did you forget to call StyleSheet.configure? If you don't want to use any themes or breakpoints, simply call it with an empty object {}.");
    }

    return *this->_state;
}

void core::UnistylesRegistry::createState() {
    this->_state = std::make_unique<UnistylesState>();
}

void core::UnistylesRegistry::updateTheme(jsi::Runtime& rt, uint64_t generation, std::string& themeName, jsi::Function&& callback) {
    auto& state = this->getState();
    auto it = state._jsThemes.find(themeName);

    helpers::assertThat(rt, it != state._jsThemes.end(), "Unistyles: You're trying to update theme '" + themeName + "' but it wasn't registered.");

    auto result = callback.call(rt, it->second);

    helpers::assertThat(rt, result.isObject(), "Unistyles: Returned theme is not an object. Please check your updateTheme function.");

    auto theme = result.asObject(rt);
    std::lock_guard<std::mutex> lock(this->_ownershipMutex);

    if (!this->isCurrent(generation)) {
        throw std::runtime_error(helpers::RUNTIME_REPLACED_ERROR);
    }

    it->second = std::move(theme);
}

void core::UnistylesRegistry::linkShadowNodeWithUnistyle(
    jsi::Runtime& rt,
    uint64_t generation,
    const std::shared_ptr<const ShadowNodeFamily>& shadowNodeFamily,
    std::vector<std::shared_ptr<UnistyleData>>& unistylesData,
    std::optional<folly::dynamic> initialScopedUpdate
) {
    // released after unlocking, so a family destructor never runs within the lock
    ReleasedFamilies releasedFamilies;
    std::lock_guard<std::mutex> lock(this->_ownershipMutex);

    if (!this->isCurrent(generation)) {
        return;
    }

    this->trafficController.withLock([this, &unistylesData, &shadowNodeFamily, &initialScopedUpdate, &releasedFamilies](){
        auto family = shadowNodeFamily.get();
        auto it = this->_shadowRegistry.find(family);

        // Clear suspension state if this family was previously suspended
        // native props stay, they hold values from theme changes that React doesn't know about
        if (it != this->_shadowRegistry.end() && it->second.isSuspended) {
            // Clear old registry entries to prevent stale UnistyleData accumulation
            // and any stale traffic controller entry (e.g. from a theme change during suspension)
            this->forgetFamilyUnsafe(family, releasedFamilies);
        }

        auto& linkedFamily = this->_shadowRegistry[family];

        linkedFamily.family = shadowNodeFamily;
        linkedFamily.unistyles.insert(linkedFamily.unistyles.end(), unistylesData.begin(), unistylesData.end());

        // Required for scoped themes to apply on initial mount
        if (initialScopedUpdate.has_value()) {
            this->trafficController.setUpdate(shadowNodeFamily, std::move(*initialScopedUpdate));
        }

        // families unmounted without unlink (eg. while frozen) are pinned by us only
        // sweep them once the registry doubles, so it's amortized O(1) per link
        if (this->_shadowRegistry.size() >= this->_sweepThreshold) {
            this->sweepUnownedFamiliesUnsafe(releasedFamilies);
            this->_sweepThreshold = std::max(MIN_SWEEP_THRESHOLD, this->_shadowRegistry.size() * 2);
        }
    });
}

bool core::UnistylesRegistry::isOwnedOnlyByUnistyles(const LinkedFamily& linkedFamily) noexcept {
    // shadow nodes own their family, so if nothing but our pin owns it, the family is not part of any
    // shadow tree anymore. React Native can't get it back, as it only keeps weak references beside shadow nodes
    return linkedFamily.family.use_count() == 1;
}

void core::UnistylesRegistry::forgetFamilyUnsafe(const ShadowNodeFamily* shadowNodeFamily, ReleasedFamilies& releasedFamilies) {
    auto it = this->_shadowRegistry.find(shadowNodeFamily);

    if (it != this->_shadowRegistry.end()) {
        releasedFamilies.emplace_back(std::move(it->second.family));
        this->_shadowRegistry.erase(it);
    }

    if (auto pendingFamily = this->trafficController.removeShadowNode(shadowNodeFamily)) {
        releasedFamilies.emplace_back(std::move(pendingFamily));
    }
}

void core::UnistylesRegistry::sweepUnownedFamiliesUnsafe(ReleasedFamilies& releasedFamilies) {
    std::vector<const ShadowNodeFamily*> unownedFamilies;

    for (const auto& [family, linkedFamily] : this->_shadowRegistry) {
        if (isOwnedOnlyByUnistyles(linkedFamily)) {
            unownedFamilies.emplace_back(family);
        }
    }

    for (const auto* family : unownedFamilies) {
        this->forgetFamilyUnsafe(family, releasedFamilies);
    }
}

void core::UnistylesRegistry::removeDuplicatedUnistyles(const ShadowNodeFamily *shadowNodeFamily, std::vector<core::Unistyle::Shared>& unistyles) {
    auto it = this->_shadowRegistry.find(shadowNodeFamily);

    if (it == this->_shadowRegistry.end()) {
        return;
    }

    auto& targetFamilyUnistyles = it->second.unistyles;

    unistyles.erase(
        std::remove_if(
            unistyles.begin(),
            unistyles.end(),
            [&targetFamilyUnistyles](const core::Unistyle::Shared& unistyle) {
                return std::any_of(
                    targetFamilyUnistyles.begin(),
                    targetFamilyUnistyles.end(),
                    [&unistyle](const std::shared_ptr<core::UnistyleData>& data) {
                        return data->unistyle == unistyle;
                    }
                );
            }
        ),
        unistyles.end()
    );
}

void core::UnistylesRegistry::unlinkShadowNodeWithUnistyles(const ShadowNodeFamily* shadowNodeFamily) {
    ReleasedFamilies releasedFamilies;

    this->trafficController.withLock([this, shadowNodeFamily, &releasedFamilies](){
        this->forgetFamilyUnsafe(shadowNodeFamily, releasedFamilies);
    });
}

void core::UnistylesRegistry::suspendShadowNode(const ShadowNodeFamily* shadowNodeFamily) {
    this->trafficController.withLock([this, shadowNodeFamily](){
        auto it = this->_shadowRegistry.find(shadowNodeFamily);

        if (it != this->_shadowRegistry.end()) {
            it->second.isSuspended = true;
        }
    });
}

bool core::UnistylesRegistry::isSuspended(const ShadowNodeFamily* family) const noexcept {
    auto it = this->_shadowRegistry.find(family);

    return it != this->_shadowRegistry.end() && it->second.isSuspended;
}

std::shared_ptr<core::StyleSheet> core::UnistylesRegistry::addStyleSheet(jsi::Runtime& rt, uint64_t generation, core::StyleSheetType type, jsi::Object&& rawValue) {
    std::lock_guard<std::mutex> lock(this->_ownershipMutex);

    if (!this->isCurrent(generation)) {
        throw std::runtime_error(helpers::RUNTIME_REPLACED_ERROR);
    }

    int tag = _nextStyleSheetTag.fetch_add(1);

    auto sheet = std::make_shared<core::StyleSheet>(tag, type, std::move(rawValue));
    this->_styleSheetRegistry[tag] = sheet;

    return sheet;
}

core::DependencyMap core::UnistylesRegistry::buildDependencyMap(std::vector<UnistyleDependency>& deps) {
    core::DependencyMap dependencyMap;

    std::unordered_set<UnistyleDependency> uniqueDependencies(deps.begin(), deps.end());
    ReleasedFamilies releasedFamilies;

    // families stay pinned by the registry until the shadow tree update is committed
    this->trafficController.withLock([this, &dependencyMap, &uniqueDependencies, &releasedFamilies](){
        // we iterate whole registry anyway, so it's a free moment to drop families unmounted without unlink
        this->sweepUnownedFamiliesUnsafe(releasedFamilies);

        for (const auto& [family, linkedFamily] : this->_shadowRegistry) {
            bool hasAnyOfDependencies = false;

            // Check if any dependency matches
            for (const auto& unistyleData : linkedFamily.unistyles) {
                for (const auto& dep : unistyleData->unistyle->dependencies) {
                    if (uniqueDependencies.count(dep)) {
                        hasAnyOfDependencies = true;
                        break;
                    }
                }

                if (hasAnyOfDependencies) {
                    break;
                };
            }

            if (!hasAnyOfDependencies) {
                continue;
            }

            dependencyMap[family].insert(
                dependencyMap[family].end(),
                linkedFamily.unistyles.begin(),
                linkedFamily.unistyles.end()
            );
        }
    });

    return dependencyMap;
}

void core::UnistylesRegistry::queueShadowLeafUpdatesUnsafe(shadow::ShadowLeafUpdates& updates) {
    for (auto& [family, props] : updates) {
        auto it = this->_shadowRegistry.find(family);

        // family was unlinked in the meantime, there is nothing to update
        if (it == this->_shadowRegistry.end()) {
            continue;
        }

        this->trafficController.setUpdate(it->second.family, std::move(props));
    }
}

// called from proxied function only, we don't know host
// so we need to rebuild all instances as they may have different variants
void core::UnistylesRegistry::shadowLeafUpdateFromUnistyle(jsi::Runtime& rt, Unistyle::Shared unistyle, jsi::Value& maybePressableId) {
    shadow::ShadowLeafUpdates updates;
    this->trafficController.withLock([this, &rt, &maybePressableId, unistyle, &updates](){
        auto parser = parser::Parser(nullptr);
        std::optional<std::string> pressableId = maybePressableId.isString()
            ? std::make_optional(maybePressableId.asString(rt).utf8(rt))
            : std::nullopt;

        for (const auto& [family, linkedFamily] : this->_shadowRegistry) {
            for (const auto& unistyleData : linkedFamily.unistyles) {
                if (unistyleData->unistyle == unistyle) {
                    updates[family] = parser.parseStylesToShadowTreeStyles(rt, { unistyleData });
                }
            }
        }

        this->queueShadowLeafUpdatesUnsafe(updates);
    });
}

std::vector<std::shared_ptr<core::StyleSheet>>core::UnistylesRegistry::getStyleSheetsToRefresh(std::vector<UnistyleDependency>& unistylesDependencies) {
    std::vector<std::shared_ptr<core::StyleSheet>> stylesheetsToRefresh;
    std::unordered_set<UnistyleDependency> depSet(
        unistylesDependencies.begin(),
        unistylesDependencies.end()
    );

    bool themeDidChange = depSet.count(UnistyleDependency::THEME) > 0;
    bool runtimeDidChange = (themeDidChange && depSet.size() > 1) || !depSet.empty();

    if (!themeDidChange && !runtimeDidChange) {
        return stylesheetsToRefresh;
    }

    auto hasMatchingDependency = [&depSet](const auto& unistyles) {
        for (const auto& [_, unistyle] : unistyles) {
            for (const auto& dep : unistyle->dependencies) {
                if (depSet.count(dep)) {
                    return true;
                }
            }
        }

        return false;
    };

    for (const auto& [_, styleSheet] : this->_styleSheetRegistry) {
        if (styleSheet->type == StyleSheetType::ThemableWithMiniRuntime || styleSheet->type == StyleSheetType::Static) {
            if (hasMatchingDependency(styleSheet->unistyles)) {
                stylesheetsToRefresh.emplace_back(styleSheet);
            }
        }

        if (styleSheet->type == StyleSheetType::Themable && themeDidChange) {
            stylesheetsToRefresh.emplace_back(styleSheet);
        }
    }

    return stylesheetsToRefresh;
}

core::Unistyle::Shared core::UnistylesRegistry::getUnistyleById(std::string unistyleID) {
    for (auto& pair: this->_styleSheetRegistry) {
        auto [_, stylesheet] = pair;

        for (auto unistylePair: stylesheet->unistyles) {
            auto [_, unistyle] = unistylePair;

            if (unistyle->unid == unistyleID) {
                return unistyle;
            }
        }
    }

    return nullptr;
}

const std::optional<std::string> core::UnistylesRegistry::getScopedTheme() {
    return this->_scopedTheme;
}

void core::UnistylesRegistry::setScopedTheme(std::optional<std::string> themeName) {
    this->_scopedTheme = std::move(themeName);
}

uint64_t core::UnistylesRegistry::takeOwnership() {
    std::lock_guard<std::mutex> lock(this->_ownershipMutex);
    auto previousGeneration = this->_generation.load();

    if (previousGeneration != 0) {
        this->_replacedStates[previousGeneration] = this->takeOwnedState();
    }

    this->_generation.store(++this->_lastGeneration);

    return this->_lastGeneration;
}

void core::UnistylesRegistry::releaseOwnership(uint64_t generation) {
    // called when module is invalidated, before React Native destroys the runtime
    // declared before the lock, so jsi values and pins are released after unlocking
    OwnedState releasedState;

    {
        std::lock_guard<std::mutex> lock(this->_ownershipMutex);

        if (this->isCurrent(generation)) {
            releasedState = this->takeOwnedState();
            this->_generation.store(0);
        } else if (auto it = this->_replacedStates.find(generation); it != this->_replacedStates.end()) {
            releasedState = std::move(it->second);
            this->_replacedStates.erase(it);
        }
    }

    for (auto& [_, styleSheet] : releasedState.styleSheets) {
        styleSheet->unistyles.clear();
    }
}

core::UnistylesRegistry::OwnedState core::UnistylesRegistry::takeOwnedState() {
    OwnedState ownedState;

    this->trafficController.withLock([this, &ownedState](){
        ownedState.shadowRegistry = std::exchange(this->_shadowRegistry, {});
        ownedState.updates = this->trafficController.takeUpdates();
        this->_sweepThreshold = MIN_SWEEP_THRESHOLD;
    });

    ownedState.styleSheets = std::exchange(this->_styleSheetRegistry, {});
    ownedState.state = std::move(this->_state);
    this->_scopedTheme = std::nullopt;
    this->_committedTags.clear();
    _nextStyleSheetTag.store(0);

    return ownedState;
}

std::vector<core::LinkedFamilySnapshot> core::UnistylesRegistry::getLinkedFamiliesSnapshot() {
    std::vector<LinkedFamilySnapshot> snapshot;

    this->trafficController.withLock([this, &snapshot](){
        snapshot.reserve(this->_shadowRegistry.size());

        for (const auto& [_, linkedFamily] : this->_shadowRegistry) {
            const bool isOwnedOnlyByUnistyles = this->isOwnedOnlyByUnistyles(linkedFamily);

            snapshot.push_back({linkedFamily.family, linkedFamily.unistyles, linkedFamily.isSuspended, isOwnedOnlyByUnistyles});
        }
    });

    return snapshot;
}

size_t core::UnistylesRegistry::getPendingUpdatesCount() {
    return this->trafficController.withLock([this](){
        return this->trafficController.getUpdatesCount();
    });
}

void core::UnistylesRegistry::setCommittedTags(std::vector<Tag>&& tags) {
    this->_committedTags = std::move(tags);
}

std::vector<Tag> core::UnistylesRegistry::takeCommittedTags() {
    return std::exchange(this->_committedTags, {});
}
