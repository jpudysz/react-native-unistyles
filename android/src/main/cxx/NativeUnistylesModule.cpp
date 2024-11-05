#include "NativeUnistylesModule.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

UnistylesModule::UnistylesModule(
    jni::alias_ref<UnistylesModule::jhybridobject> jThis,
    jni::alias_ref<react::JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager
): _runtimeExecutor(runtimeExecutorHolder->cthis()->get()), _uiManager(fabricUIManager->getBinding()->getScheduler()->getUIManager()) {}

jni::local_ref<UnistylesModule::jhybriddata> UnistylesModule::initHybrid(
    jni::alias_ref<UnistylesModule::jhybridobject> jThis,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager
) {
    return makeCxxInstance(jThis, runtimeExecutorHolder, fabricUIManager);
}

void UnistylesModule::registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("getBindingsInstaller", UnistylesModule::getBindingsInstaller),
        makeNativeMethod("initHybrid", UnistylesModule::initHybrid)
    });
}

jni::local_ref<BindingsInstallerHolder::javaobject> UnistylesModule::getBindingsInstaller(jni::alias_ref<UnistylesModule::jhybriddata> jthis) {
    return BindingsInstallerHolder::newObjectCxxArgs([jthis](jsi::Runtime& rt) {
        auto* cppInstance = reinterpret_cast<UnistylesModule*>(jthis.get());
        auto& runtimeExecutor = cppInstance->_runtimeExecutor;
        auto& uiManager = cppInstance->_uiManager;

        // todo init hybrids
    });
}
