#include <jni.h>
#include <jsi/jsi.h>
#include <map>
#include <ReactCommon/CallInvokerHolder.h>
#include "UnistylesRuntime.h"
#include "helpers.h"
#include "platform.h"

using namespace facebook;

static jobject unistylesModule = nullptr;
std::shared_ptr<UnistylesRuntime> unistylesRuntime = nullptr;

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeInstall(JNIEnv *env, jobject thiz, jlong jsi, jobject callInvokerHolder) {
    auto runtime = reinterpret_cast<jsi::Runtime *>(jsi);
    auto callInvoker{
        jni::alias_ref<react::CallInvokerHolder::javaobject>{ reinterpret_cast<react::CallInvokerHolder::javaobject>(callInvokerHolder)} -> cthis() ->getCallInvoker()
    };

    if (unistylesModule == nullptr) {
        unistylesModule = env->NewGlobalRef(thiz);
    }

    if (unistylesModule == nullptr) {
        return throwKotlinException(env, "Something went wrong while initializing UnistylesModule");
    }

    unistylesRuntime = std::make_shared<UnistylesRuntime>(*runtime, callInvoker);
    makeShared(env, unistylesModule, unistylesRuntime);

    jsi::Object hostObject = jsi::Object::createFromHostObject(*runtime, unistylesRuntime);
    runtime->global().setProperty(*runtime, "__UNISTYLES__", std::move(hostObject));
}

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeDestroy(JNIEnv *env, jobject thiz) {
    unistylesRuntime.reset();
    unistylesModule = nullptr;
}

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeOnOrientationChange(JNIEnv *env, jobject thiz, jobject screen, jobject insets, jobject statusBar, jobject navigationBar) {
    if (unistylesRuntime != nullptr) {
        Screen screenDimensions = jobjectToScreen(env, screen);
        Dimensions statusBarDimensions = jobjectToDimensions(env, statusBar);
        Insets screenInsets = jobjectToInsets(env, insets);
        Dimensions navigationBarDimensions = jobjectToDimensions(env, navigationBar);

        unistylesRuntime->handleScreenSizeChange(screenDimensions, screenInsets, statusBarDimensions, navigationBarDimensions);
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeOnAppearanceChange(JNIEnv *env, jobject thiz, jstring colorScheme) {
    if (unistylesRuntime != nullptr) {
        unistylesRuntime->handleAppearanceChange(env->GetStringUTFChars(colorScheme, nullptr));
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeOnContentSizeCategoryChange(JNIEnv *env, jobject thiz, jstring contentSizeCategory) {
    if (unistylesRuntime != nullptr) {
        unistylesRuntime->handleContentSizeCategoryChange(env->GetStringUTFChars(contentSizeCategory, nullptr));
    }
}
