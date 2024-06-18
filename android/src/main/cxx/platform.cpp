#include "platform.h"

void makeShared(JNIEnv *env, jobject unistylesModule, std::shared_ptr<UnistylesRuntime> unistylesRuntime) {
    unistylesRuntime->setScreenDimensionsCallback([&](){
        return getScreenDimensions(env, unistylesModule);
    });

    unistylesRuntime->setColorSchemeCallback([&](){
        return getColorScheme(env, unistylesModule);
    });

    unistylesRuntime->setStatusBarDimensionsCallback([&](){
        return getStatusBarDimensions(env, unistylesModule);
    });

    unistylesRuntime->setNavigationBarDimensionsCallback([&](){
        return getNavigationBarDimensions(env, unistylesModule);
    });

    unistylesRuntime->setInsetsCallback([&](){
        return getInsets(env, unistylesModule);
    });

    unistylesRuntime->setContentSizeCategoryCallback([&](){
        return getContentSizeCategory(env, unistylesModule);
    });

    unistylesRuntime->setNavigationBarColorCallback([=](const std::string &color) {
        setNavigationBarColor(env, unistylesModule, color);
    });

    unistylesRuntime->setStatusBarColorCallback([=](const std::string &color) {
        setStatusBarColor(env, unistylesModule, color);
    });

    unistylesRuntime->setNavigationBarHiddenCallback([=](bool hidden) {
        setNavigationBarHidden(env, unistylesModule, hidden);
    });

    unistylesRuntime->screen = getScreenDimensions(env, unistylesModule);
    unistylesRuntime->contentSizeCategory = getContentSizeCategory(env, unistylesModule);
    unistylesRuntime->colorScheme = getColorScheme(env, unistylesModule);
    unistylesRuntime->statusBar = getStatusBarDimensions(env, unistylesModule);
    unistylesRuntime->insets = getInsets(env, unistylesModule);
    unistylesRuntime->navigationBar = getNavigationBarDimensions(env, unistylesModule);
}

Dimensions getScreenDimensions(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "getScreenDimensions", "()Lcom/unistyles/Dimensions;");
    jobject dimensionsObj = env->CallObjectMethod(unistylesModule, methodId);
    Dimensions screenDimensions = jobjectToDimensions(env, dimensionsObj);

    return screenDimensions;
}

std::string getColorScheme(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "getColorScheme", "()Ljava/lang/String;");
    jstring colorScheme = (jstring) env->CallObjectMethod(unistylesModule, methodId);
    const char *colorSchemeChars = env->GetStringUTFChars(colorScheme, nullptr);
    std::string colorSchemeStr = std::string(colorSchemeChars);

    env->ReleaseStringUTFChars(colorScheme, colorSchemeChars);
    env->DeleteLocalRef(colorScheme);
    env->DeleteLocalRef(cls);

    return colorSchemeStr;
}

Dimensions getStatusBarDimensions(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "getStatusBarDimensions", "()Lcom/unistyles/Dimensions;");
    jobject dimensionsObj = env->CallObjectMethod(unistylesModule, methodId);
    Dimensions statusBarDimensions = jobjectToDimensions(env, dimensionsObj);

    return statusBarDimensions;
}

Dimensions getNavigationBarDimensions(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "getNavigationBarDimensions", "()Lcom/unistyles/Dimensions;");
    jobject dimensionsObj = env->CallObjectMethod(unistylesModule, methodId);
    Dimensions navigationBarDimensions = jobjectToDimensions(env, dimensionsObj);

    return navigationBarDimensions;
}

Insets getInsets(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "getInsets", "()Lcom/unistyles/Insets;");
    jobject insetsObj = env->CallObjectMethod(unistylesModule, methodId);
    Insets insets = jobjectToInsets(env, insetsObj);

    return insets;
}

std::string getContentSizeCategory(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "getContentSizeCategory", "()Ljava/lang/String;");
    jstring contentSizeCategory = (jstring) env->CallObjectMethod(unistylesModule, methodId);
    const char *contentSizeCategoryChars = env->GetStringUTFChars(contentSizeCategory, nullptr);
    std::string contentSizeCategoryStr = std::string(contentSizeCategoryChars);

    env->ReleaseStringUTFChars(contentSizeCategory, contentSizeCategoryChars);
    env->DeleteLocalRef(contentSizeCategory);
    env->DeleteLocalRef(cls);

    return contentSizeCategoryStr;
}

void setStatusBarColor(JNIEnv *env, jobject unistylesModule, std::string color) {
    jstring colorStr = env->NewStringUTF(color.c_str());
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "onSetStatusBarColor", "(Ljava/lang/String;)V");

    env->CallVoidMethod(unistylesModule, methodId, colorStr);
    env->DeleteLocalRef(colorStr);
    env->DeleteLocalRef(cls);
}

void setNavigationBarColor(JNIEnv *env, jobject unistylesModule, std::string color) {
    jstring colorStr = env->NewStringUTF(color.c_str());
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "onSetNavigationBarColor", "(Ljava/lang/String;)V");

    env->CallVoidMethod(unistylesModule, methodId, colorStr);
    env->DeleteLocalRef(colorStr);
    env->DeleteLocalRef(cls);
}

void setNavigationBarHidden(JNIEnv *env, jobject unistylesModule, bool hidden) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jmethodID methodId = env->GetMethodID(cls, "setNavigationBarHidden", "(Z)V");

    env->CallVoidMethod(unistylesModule, methodId, hidden);
    env->DeleteLocalRef(cls);
}
