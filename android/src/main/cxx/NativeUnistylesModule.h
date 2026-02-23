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
        jni::alias_ref<JHybridNativePlatformSpec::javaobject> nativePlatform
    );

    static void registerNatives();
    static jni::local_ref<jhybriddata> initHybrid(
        jni::alias_ref<jhybridobject> jThis,
        jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
        jni::alias_ref<JHybridNativePlatformSpec::javaobject> nativePlatform
    );
    static void invalidateNative(jni::alias_ref<jhybridobject> jThis) {
        auto* self = jThis->cthis();

        if (self->_runtime) {
            core::UnistylesRegistry::get().destroyState(self->_runtime);
            self->_runtime = nullptr;
        }
    }

    static jni::local_ref<BindingsInstallerHolder::javaobject> getBindingsInstaller(jni::alias_ref<UnistylesModule::javaobject> jThis);

private:
    RuntimeExecutor _runtimeExecutor;
    std::shared_ptr<HybridNativePlatformSpec> _nativePlatform;
    jsi::Runtime* _runtime = nullptr;
};

}
