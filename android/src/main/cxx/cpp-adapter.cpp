#include <jni.h>
#include "unistylesOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    return margelo::nitro::unistyles::initialize(vm);
}
