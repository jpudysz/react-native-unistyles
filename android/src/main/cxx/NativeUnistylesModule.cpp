#include "NativeUnistylesModule.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStyleSheet.h"
#import "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

UnistylesModule::UnistylesModule(
    jni::alias_ref<UnistylesModule::jhybridobject> jThis,
    jni::alias_ref<react::JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager,
    jni::alias_ref<JHybridNativePlatformSpec::javaobject> nativePlatform
):  _runtimeExecutor(runtimeExecutorHolder->cthis()->get()),
    _uiManager(fabricUIManager->getBinding()->getScheduler()->getUIManager()),
    _nativePlatform(reinterpret_cast<Unistyles::HybridNativePlatformSpecCxx*>(nativePlatform->cthis())) {}

jni::local_ref<UnistylesModule::jhybriddata> UnistylesModule::initHybrid(
    jni::alias_ref<UnistylesModule::jhybridobject> jThis,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutorHolder,
    jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager,
    jni::alias_ref<JHybridNativePlatformSpec::javaobject> nativePlatform
) {
    return makeCxxInstance(jThis, runtimeExecutorHolder, fabricUIManager, nativePlatform);
}

void UnistylesModule::registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("getBindingsInstaller", UnistylesModule::getBindingsInstaller),
        makeNativeMethod("initHybrid", UnistylesModule::initHybrid)
    });
}

jni::local_ref<BindingsInstallerHolder::javaobject> UnistylesModule::getBindingsInstaller(jni::alias_ref<UnistylesModule::jhybriddata> jthis) {
    return BindingsInstallerHolder::newObjectCxxArgs([jthis](jsi::Runtime& rt) {
        // function is called on: first init and every live reload
        // check if this is live reload, if so let's replace UnistylesRuntime with new runtime
        auto hasUnistylesRuntime = HybridObjectRegistry::hasHybridObject("UnistylesRuntime");

        if (hasUnistylesRuntime) {
            HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesRuntime");
            HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesStyleSheet");
            HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesShadowRegistry");
        }

        auto* cppInstance = reinterpret_cast<UnistylesModule*>(jthis.get());
        auto& runtimeExecutor = cppInstance->_runtimeExecutor;
        auto& uiManager = cppInstance->_uiManager;
        auto runOnJSThread = [&](std::function<void(jsi::Runtime&)>&& callback) {
            runtimeExecutor([&](jsi::Runtime &rt) {
                callback(rt);
            });
        };

        // init hybrids
        auto& nativePlatform = cppInstance->_nativePlatform;
        auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(*nativePlatform, rt, runOnJSThread);
        auto styleSheet = std::make_shared<HybridStyleSheet>(unistylesRuntime, uiManager);

        HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
            return unistylesRuntime;
        });
        HybridObjectRegistry::registerHybridObjectConstructor("UnistylesStyleSheet", [styleSheet]() -> std::shared_ptr<HybridObject>{
            return styleSheet;
        });
        HybridObjectRegistry::registerHybridObjectConstructor("UnistylesShadowRegistry", []() -> std::shared_ptr<HybridObject>{
            return std::make_shared<HybridShadowRegistry>();
        });
    });
}
