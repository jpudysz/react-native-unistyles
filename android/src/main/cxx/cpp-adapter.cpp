#include <jni.h>
#include <fbjni/fbjni.h>
#include "unistylesOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    return facebook::jni::initialize(vm, [=] {
        margelo::nitro::unistyles::initialize(vm);

        // todo init hybrids
    });
}
