#include "NativeUnistylesModule.h"
#import <NitroModules/HybridObjectRegistry.hpp>
#import "HybridUnistylesRuntime.h"
#import "HybridStyleSheet.h"
#import "HybridShadowRegistry.h"

using namespace margelo::nitro::unistyles;
using namespace facebook::react;

UnistylesModule::UnistylesModule(
    jni::alias_ref<UnistylesModule::jhybridobject> jThis,
    jni::alias_ref<JHybridNativePlatformSpec::JavaPart> nativePlatform
):  _nativePlatform(nativePlatform->getJHybridNativePlatformSpec()) {}

jni::local_ref<UnistylesModule::jhybriddata> UnistylesModule::initHybrid(
    jni::alias_ref<UnistylesModule::jhybridobject> jThis,
    jni::alias_ref<JHybridNativePlatformSpec::JavaPart> nativePlatform
) {
    return makeCxxInstance(jThis, nativePlatform);
}

void UnistylesModule::registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("getBindingsInstaller", UnistylesModule::getBindingsInstaller),
        makeNativeMethod("initHybrid", UnistylesModule::initHybrid),
        makeNativeMethod("invalidateNative", invalidateNative),
    });
}

jni::local_ref<BindingsInstallerHolder::javaobject> UnistylesModule::getBindingsInstaller(jni::alias_ref<UnistylesModule::javaobject> jobj) {
    auto* self = jobj->cthis();
    auto& nativePlatform = self->_nativePlatform;

    return BindingsInstallerHolder::newObjectCxxArgs([self, &nativePlatform](jsi::Runtime& rt, const std::shared_ptr<CallInvoker>& callInvoker) {
        // function is called on: first init and every live reload
        // newest runtime owns the registry, previous runtime's state is kept until it releases ownership
        self->_generation = core::UnistylesRegistry::get().takeOwnership();

        // check if this is live reload, if so let's replace UnistylesRuntime with new runtime
        auto hasUnistylesRuntime = HybridObjectRegistry::hasHybridObject("UnistylesRuntime");

        if (hasUnistylesRuntime) {
            HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesRuntime");
            HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesStyleSheet");
            HybridObjectRegistry::unregisterHybridObjectConstructor("UnistylesShadowRegistry");
        }

        auto runOnJSThread = [callInvoker](std::function<void(jsi::Runtime&)>&& callback) {
            callInvoker->invokeAsync(std::move(callback));
        };

        // init hybrids
        auto unistylesRuntime = std::make_shared<HybridUnistylesRuntime>(nativePlatform, runOnJSThread, self->_generation);
        auto styleSheet = std::make_shared<HybridStyleSheet>(unistylesRuntime);

        HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
            return unistylesRuntime;
        });
        HybridObjectRegistry::registerHybridObjectConstructor("UnistylesStyleSheet", [styleSheet]() -> std::shared_ptr<HybridObject>{
            return styleSheet;
        });
        HybridObjectRegistry::registerHybridObjectConstructor("UnistylesShadowRegistry", [unistylesRuntime]() -> std::shared_ptr<HybridObject>{
            return std::make_shared<HybridShadowRegistry>(unistylesRuntime);
        });
    });
}
