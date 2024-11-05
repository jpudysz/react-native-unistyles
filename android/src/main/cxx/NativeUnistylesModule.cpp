#include "NativeUnistylesModule.h"

using namespace margelo::nitro::unistyles;

void UnistylesModule::registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("getBindingsInstaller", UnistylesModule::getBindingsInstaller)
    });
}

jni::local_ref<react::BindingsInstallerHolder::javaobject> UnistylesModule::getBindingsInstaller(jni::alias_ref<UnistylesModule> jobj) {
    return react::BindingsInstallerHolder::newObjectCxxArgs([](jsi::Runtime& rt) {
        // todo init hybrids
    });
}
