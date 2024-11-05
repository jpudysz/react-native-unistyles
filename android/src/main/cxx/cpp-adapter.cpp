#include <fbjni/fbjni.h>
#include "unistylesOnLoad.hpp"
#include "NativeUnistylesModule.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
    return facebook::jni::initialize(vm, [=] {
        margelo::nitro::unistyles::UnistylesModule::registerNatives();
        margelo::nitro::unistyles::initialize(vm);
    });
}
