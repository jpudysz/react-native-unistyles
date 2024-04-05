#include <jni.h>
#include <jsi/jsi.h>
#include <map>
#include "UnistylesRuntime.h"
#include "helpers.h"

using namespace facebook;

static jobject unistylesModule = nullptr;
std::shared_ptr<UnistylesRuntime> unistylesRuntime = nullptr;

extern "C"
JNIEXPORT void JNICALL
Java_com_unistyles_UnistylesModule_nativeInstall(
        JNIEnv *env,
        jobject thiz,
        jlong jsi,
        jobject screen,
        jstring colorScheme,
        jstring contentSizeCategory,
        jobject insets,
        jobject statusBar,
        jobject navigationBar
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

    const char *contentSizeCategoryChars = env->GetStringUTFChars(contentSizeCategory, nullptr);
    std::string contentSizeCategoryStr(contentSizeCategoryChars);
    env->ReleaseStringUTFChars(contentSizeCategory, contentSizeCategoryChars);

    unistylesRuntime = std::make_shared<UnistylesRuntime>(
        jobjectToDimensions(env, screen),
        colorSchemeStr,
        contentSizeCategoryStr,
        jobjectToInsets(env, insets),
        jobjectToDimensions(env, statusBar),
        jobjectToDimensions(env, navigationBar)
    );

    unistylesRuntime->onThemeChange([=](const std::string &theme) {
        jstring themeStr = env->NewStringUTF(theme.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onThemeChange", "(Ljava/lang/String;)V");

        env->CallVoidMethod(unistylesModule, methodId, themeStr);
        env->DeleteLocalRef(themeStr);
        env->DeleteLocalRef(cls);
    });

    unistylesRuntime->onLayoutChange([=](const std::string &breakpoint, const std::string &orientation, Dimensions& screen, Dimensions& statusBar, Insets& insets, Dimensions& navigationBar) {
        jstring breakpointStr = env->NewStringUTF(breakpoint.c_str());
        jstring orientationStr = env->NewStringUTF(orientation.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jclass dimensionsClass = env->FindClass("com/unistyles/Dimensions");
        jmethodID dimensionsConstructor = env->GetMethodID(dimensionsClass, "<init>", "(II)V");
        jobject screenObj = env->NewObject(dimensionsClass, dimensionsConstructor, screen.width, screen.height);
        jobject statusBarObj = env->NewObject(dimensionsClass, dimensionsConstructor, statusBar.width, statusBar.height);
        jobject navigationBarObj = env->NewObject(dimensionsClass, dimensionsConstructor, navigationBar.width, navigationBar.height);

        jclass insetsClass = env->FindClass("com/unistyles/Insets");
        jmethodID insetsConstructor = env->GetMethodID(insetsClass, "<init>", "(IIII)V");
        jobject insetsObj = env->NewObject(insetsClass, insetsConstructor, insets.left, insets.top, insets.right, insets.bottom);
        jmethodID methodId = env->GetMethodID(cls, "onLayoutChange",
                                              "(Ljava/lang/String;Ljava/lang/String;Lcom/unistyles/Dimensions;Lcom/unistyles/Dimensions;Lcom/unistyles/Insets;Lcom/unistyles/Dimensions;)V");

        env->CallVoidMethod(unistylesModule, methodId, breakpointStr, orientationStr, screenObj, statusBarObj, insetsObj, navigationBarObj);
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

    unistylesRuntime->onContentSizeCategoryChange([=](const std::string &contentSizeCategory) {
        jstring contentSizeCategoryStr = env->NewStringUTF(contentSizeCategory.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onContentSizeCategoryChange", "(Ljava/lang/String;)V");

        env->CallVoidMethod(unistylesModule, methodId, contentSizeCategoryStr);
        env->DeleteLocalRef(contentSizeCategoryStr);
        env->DeleteLocalRef(cls);
    });

    unistylesRuntime->onSetNavigationBarColor([=](const std::string &color) {
        jstring colorStr = env->NewStringUTF(color.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onSetNavigationBarColor", "(Ljava/lang/String;)V");

        env->CallVoidMethod(unistylesModule, methodId, colorStr);
        env->DeleteLocalRef(colorStr);
        env->DeleteLocalRef(cls);
    });

    unistylesRuntime->onSetStatusBarColor([=](const std::string &color) {
        jstring colorStr = env->NewStringUTF(color.c_str());
        jclass cls = env->GetObjectClass(unistylesModule);
        jmethodID methodId = env->GetMethodID(cls, "onSetStatusBarColor", "(Ljava/lang/String;)V");

        env->CallVoidMethod(unistylesModule, methodId, colorStr);
        env->DeleteLocalRef(colorStr);
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
Java_com_unistyles_UnistylesModule_nativeOnOrientationChange(JNIEnv *env, jobject thiz, jobject screen, jobject insets, jobject statusBar, jobject navigationBar) {
    if (unistylesRuntime != nullptr) {
        Dimensions screenDimensions = jobjectToDimensions(env, screen);
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
