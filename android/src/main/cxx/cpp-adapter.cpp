#include <jni.h>
#include <jsi/jsi.h>
#include "UnistylesRuntime.h"

using namespace facebook;

static jobject unistylesModule = nullptr;
std::shared_ptr<UnistylesRuntime> unistylesRuntime = nullptr;

void throwKotlinException(
    JNIEnv *env,
    const char *message
) {
    jclass runtimeExceptionClass = env->FindClass("java/lang/RuntimeException");

    if (runtimeExceptionClass != nullptr) {
        env->ThrowNew(runtimeExceptionClass, message);
        env->DeleteLocalRef(runtimeExceptionClass);
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeInstall(
        JNIEnv *env,
        jobject thiz,
        jlong jsi,
        jint screenWidth,
        jint screenHeight,
        jstring colorScheme
) {
    auto runtime = reinterpret_cast<facebook::jsi::Runtime *>(jsi);

    if (unistylesModule == nullptr) {
        unistylesModule = env->NewGlobalRef(thiz);
    }

    if (runtime == nullptr || unistylesModule == nullptr) {
        return throwKotlinException(env, "Something went wrong while initializing UnistylesModule");
    }

    const char *colorSchemeChars = env->GetStringUTFChars(colorScheme, nullptr);
    std::string colorSchemeStr(colorSchemeChars);
    env->ReleaseStringUTFChars(colorScheme, colorSchemeChars);

    unistylesRuntime = std::make_shared<UnistylesRuntime>(
        screenWidth,
        screenHeight,
        colorSchemeStr
    );

    unistylesRuntime->onThemeChange([=](const std::string &theme) {
        jstring themeStr = env->NewStringUTF(theme.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onThemeChange", "(Ljava/lang/String;)V");

        env->CallVoidMethod(unistylesModule, methodId, themeStr);
        env->DeleteLocalRef(themeStr);
        env->DeleteLocalRef(cls);
    });

    unistylesRuntime->onLayoutChange([=](const std::string &breakpoint, const std::string &orientation, int width, int height) {
        jstring breakpointStr = env->NewStringUTF(breakpoint.c_str());
        jstring orientationStr = env->NewStringUTF(orientation.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onLayoutChange", "(Ljava/lang/String;Ljava/lang/String;II)V");

        env->CallVoidMethod(unistylesModule, methodId, breakpointStr, orientationStr, width, height);
        env->DeleteLocalRef(breakpointStr);
        env->DeleteLocalRef(orientationStr);
        env->DeleteLocalRef(cls);
    });

    unistylesRuntime->onPluginChange([=]() {
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onPluginChange", "()V");

        env->CallVoidMethod(unistylesModule, methodId);
        env->DeleteLocalRef(cls);
    });

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
Java_com_unistyles_UnistylesModule_nativeOnOrientationChange(JNIEnv *env, jobject thiz, jint width, jint height) {
    if (unistylesRuntime != nullptr) {
        unistylesRuntime->handleScreenSizeChange(width, height);
    }
}

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeOnAppearanceChange(JNIEnv *env, jobject thiz, jstring colorScheme) {
    if (unistylesRuntime != nullptr) {
        unistylesRuntime->handleAppearanceChange(env->GetStringUTFChars(colorScheme, nullptr));
    }
}
