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

    unistylesRuntime->setNavigationBarColorCallback([=](const std::string &color, float alpha) {
        setNavigationBarColor(env, unistylesModule, color, alpha);
    });

    unistylesRuntime->setStatusBarColorCallback([=](const std::string &color, float alpha) {
        setStatusBarColor(env, unistylesModule, color, alpha);
    });

    unistylesRuntime->setNavigationBarHiddenCallback([=](bool hidden) {
        setNavigationBarHidden(env, unistylesModule, hidden);
    });

    unistylesRuntime->setStatusBarHiddenCallback([=](bool hidden) {
        setStatusBarHidden(env, unistylesModule, hidden);
    });

    unistylesRuntime->setImmersiveModeCallback([=](bool enabled) {
        setImmersiveMode(env, unistylesModule, enabled);
    });

    unistylesRuntime->setRootViewBackgroundColorCallback([=](const std::string &color, float alpha) {
        setRootViewBackgroundColor(env, unistylesModule, color, alpha);
    });

    Screen screen = getScreenDimensions(env, unistylesModule);

    unistylesRuntime->screen = Dimensions{screen.width, screen.height};
    unistylesRuntime->contentSizeCategory = getContentSizeCategory(env, unistylesModule);
    unistylesRuntime->colorScheme = getColorScheme(env, unistylesModule);
    unistylesRuntime->statusBar = getStatusBarDimensions(env, unistylesModule);
    unistylesRuntime->insets = getInsets(env, unistylesModule);
    unistylesRuntime->navigationBar = getNavigationBarDimensions(env, unistylesModule);
    unistylesRuntime->fontScale = screen.fontScale;
    unistylesRuntime->pixelRatio = screen.pixelRatio;
    unistylesRuntime->rtl = getIsRTL(env, unistylesModule);
}

Screen getScreenDimensions(JNIEnv *env, jobject unistylesModule) {
    jobject result = JNI_callPlatform(env, unistylesModule, "getScreenDimensions", "()Lcom/unistyles/Screen;");
    Screen screenDimensions = jobjectToScreen(env, result);

    return screenDimensions;
}

std::string getColorScheme(JNIEnv *env, jobject unistylesModule) {
    jstring colorScheme = (jstring) JNI_callPlatform(env, unistylesModule, "getColorScheme", "()Ljava/lang/String;");
    const char *colorSchemeChars = env->GetStringUTFChars(colorScheme, nullptr);
    std::string colorSchemeStr = std::string(colorSchemeChars);

    env->ReleaseStringUTFChars(colorScheme, colorSchemeChars);
    env->DeleteLocalRef(colorScheme);

    return colorSchemeStr;
}

bool getIsRTL(JNIEnv *env, jobject unistylesModule) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jfieldID platformFieldId = env->GetFieldID(cls, "platform", "Lcom/unistyles/Platform;");
    jobject platformInstance = env->GetObjectField(unistylesModule, platformFieldId);
    jclass platformClass = env->GetObjectClass(platformInstance);
    jmethodID methodId = env->GetMethodID(platformClass, "getIsRTL", "()Z");
    jboolean result = env->CallBooleanMethod(platformInstance, methodId);

    env->DeleteLocalRef(cls);
    env->DeleteLocalRef(platformInstance);
    env->DeleteLocalRef(platformClass);

    return result;
}

Dimensions getStatusBarDimensions(JNIEnv *env, jobject unistylesModule) {
    jobject dimensionsObj = JNI_callPlatform(env, unistylesModule, "getStatusBarDimensions", "()Lcom/unistyles/Dimensions;");
    Dimensions statusBarDimensions = jobjectToDimensions(env, dimensionsObj);

    return statusBarDimensions;
}

Dimensions getNavigationBarDimensions(JNIEnv *env, jobject unistylesModule) {
    jobject dimensionsObj = JNI_callPlatform(env, unistylesModule, "getNavigationBarDimensions", "()Lcom/unistyles/Dimensions;");
    Dimensions navigationBarDimensions = jobjectToDimensions(env, dimensionsObj);

    return navigationBarDimensions;
}

Insets getInsets(JNIEnv *env, jobject unistylesModule) {
    jobject insetsObj = JNI_callPlatform(env, unistylesModule, "getInsets", "()Lcom/unistyles/Insets;");
    Insets insets = jobjectToInsets(env, insetsObj);

    return insets;
}

std::string getContentSizeCategory(JNIEnv *env, jobject unistylesModule) {
    jstring contentSizeCategory = (jstring) JNI_callPlatform(env, unistylesModule, "getContentSizeCategory", "()Ljava/lang/String;");
    const char *contentSizeCategoryChars = env->GetStringUTFChars(contentSizeCategory, nullptr);
    std::string contentSizeCategoryStr = std::string(contentSizeCategoryChars);

    env->ReleaseStringUTFChars(contentSizeCategory, contentSizeCategoryChars);
    env->DeleteLocalRef(contentSizeCategory);

    return contentSizeCategoryStr;
}

void setStatusBarColor(JNIEnv *env, jobject unistylesModule, std::string color, float alpha) {
    JNI_callPlatformWithColor(env, unistylesModule, "onSetStatusBarColor", "(Ljava/lang/String;F)V", color, alpha);
}

void setNavigationBarColor(JNIEnv *env, jobject unistylesModule, std::string color, float alpha) {
    JNI_callPlatformWithColor(env, unistylesModule, "onSetNavigationBarColor", "(Ljava/lang/String;F)V", color, alpha);
}

void setNavigationBarHidden(JNIEnv *env, jobject unistylesModule, bool hidden) {
    JNI_callPlatformWithBool(env, unistylesModule, "onSetNavigationBarHidden", "(Z)V", hidden);
}

void setStatusBarHidden(JNIEnv *env, jobject unistylesModule, bool hidden) {
    JNI_callPlatformWithBool(env, unistylesModule, "onSetStatusBarHidden", "(Z)V", hidden);
}

void setImmersiveMode(JNIEnv *env, jobject unistylesModule, bool enabled) {
    JNI_callPlatformWithBool(env, unistylesModule, "onSetImmersiveMode", "(Z)V", enabled);
}

void setRootViewBackgroundColor(JNIEnv *env, jobject unistylesModule, std::string color, float alpha) {
    JNI_callPlatformWithColor(env, unistylesModule, "onSetRootViewBackgroundColor", "(Ljava/lang/String;F)V", color, alpha);
}
