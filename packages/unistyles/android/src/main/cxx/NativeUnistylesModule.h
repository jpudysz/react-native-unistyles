#pragma once

#include <ReactCommon/BindingsInstallerHolder.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/renderer/scheduler/Scheduler.h>
#include "UnistylesRegistry.h"
#include <fbjni/fbjni.h>
#include <react/fabric/Binding.h>
#include "NativePlatform.h"

namespace margelo::nitro::unistyles {

using namespace facebook;
using namespace facebook::react;

struct UnistylesModule : public jni::HybridClass<UnistylesModule> {
    static constexpr auto kJavaDescriptor = "Lcom/unistyles/UnistylesModule;";

    explicit UnistylesModule(
        jni::alias_ref<jhybridobject> jThis,
        jni::alias_ref<react::JRuntimeExecutor::javaobject> runtimeExecutorHolder,
        jni::alias_ref<JHybridNativePlatformSpec::JavaPart> nativePlatform
    );

    static void registerNatives();
    static jni::local_ref<jhybriddata> initHybrid(
        jni::alias_ref<jhybridobject> jThis,
        jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
        jni::alias_ref<JHybridNativePlatformSpec::JavaPart> nativePlatform
    );
    static void invalidateNative(jni::alias_ref<jhybridobject> jThis) {
        auto* self = jThis->cthis();

        // See UnistylesModuleOnLoad.mm: releases ownership and wipes state only if this
        // runtime is still the owner, so a superseded runtime's late teardown during an
        // OTA hard reload can't clear the new runtime's freshly configured state.
        core::UnistylesRegistry::get().releaseOwnership(self->_runtime);
    }

    static jni::local_ref<BindingsInstallerHolder::javaobject> getBindingsInstaller(jni::alias_ref<UnistylesModule::javaobject> jThis);

private:
    RuntimeExecutor _runtimeExecutor;
    std::shared_ptr<HybridNativePlatformSpec> _nativePlatform;
    jsi::Runtime* _runtime = nullptr;
};

}
