#pragma once

#include <ReactCommon/BindingsInstallerHolder.h>
#include <fbjni/fbjni.h>

namespace margelo::nitro::unistyles {

using namespace facebook;

struct UnistylesModule : public jni::JavaClass<UnistylesModule> {
    static constexpr auto kJavaDescriptor = "Lcom/unistyles/UnistylesModule;";

    UnistylesModule() = default;

    static void registerNatives();
    static jni::local_ref<react::BindingsInstallerHolder::javaobject> getBindingsInstaller(jni::alias_ref<UnistylesModule> jobj);
};

}
