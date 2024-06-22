#include "helpers.h"
#include "UnistylesRuntime.h"

Dimensions jobjectToDimensions(JNIEnv *env, jobject dimensionObj) {
    jclass dimensionClass = env->FindClass("com/unistyles/Dimensions");
    jfieldID widthFieldID = env->GetFieldID(dimensionClass, "width", "I");
    jfieldID heightFieldID = env->GetFieldID(dimensionClass, "height", "I");

    int width = env->GetIntField(dimensionObj, widthFieldID);
    int height = env->GetIntField(dimensionObj, heightFieldID);

    env->DeleteLocalRef(dimensionClass);

    return Dimensions{width, height};
}

Screen jobjectToScreen(JNIEnv *env, jobject screenObj) {
    jclass screenClass = env->FindClass("com/unistyles/Screen");
    jfieldID widthFieldID = env->GetFieldID(screenClass, "width", "I");
    jfieldID heightFieldID = env->GetFieldID(screenClass, "height", "I");
    jfieldID pixelRatioFieldID = env->GetFieldID(screenClass, "pixelRatio", "F");
    jfieldID scaleFieldID = env->GetFieldID(screenClass, "fontScale", "F");

    int width = env->GetIntField(screenObj, widthFieldID);
    int height = env->GetIntField(screenObj, heightFieldID);
    float pixelRatio = env->GetFloatField(screenObj, pixelRatioFieldID);
    float fontScale = env->GetFloatField(screenObj, scaleFieldID);

    env->DeleteLocalRef(screenClass);

    return Screen{width, height, pixelRatio, fontScale};
}

Insets jobjectToInsets(JNIEnv *env, jobject insetsObj) {
    jclass insetsClass = env->FindClass("com/unistyles/Insets");
    jfieldID leftFieldID = env->GetFieldID(insetsClass, "left", "I");
    jfieldID topFieldID = env->GetFieldID(insetsClass, "top", "I");
    jfieldID rightFieldID = env->GetFieldID(insetsClass, "right", "I");
    jfieldID bottomFieldID = env->GetFieldID(insetsClass, "bottom", "I");

    int left = env->GetIntField(insetsObj, leftFieldID);
    int top = env->GetIntField(insetsObj, topFieldID);
    int right = env->GetIntField(insetsObj, rightFieldID);
    int bottom = env->GetIntField(insetsObj, bottomFieldID);

    env->DeleteLocalRef(insetsClass);

    return Insets{top, bottom, left, right};
}

void JNI_callPlatformWithColor(JNIEnv *env, jobject unistylesModule, std::string name, std::string sig, std::string param, float alpha) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jfieldID platformFieldId = env->GetFieldID(cls, "platform", "Lcom/unistyles/Platform;");
    jobject platformInstance = env->GetObjectField(unistylesModule, platformFieldId);
    jclass platformClass = env->GetObjectClass(platformInstance);
    jstring strParam = env->NewStringUTF(param.c_str());
    jmethodID methodId = env->GetMethodID(platformClass, name.c_str(), sig.c_str());

    env->CallVoidMethod(platformInstance, methodId, strParam, static_cast<jfloat>(alpha));

    env->DeleteLocalRef(cls);
    env->DeleteLocalRef(platformInstance);
    env->DeleteLocalRef(platformClass);
    env->DeleteLocalRef(strParam);
}

void JNI_callPlatformWithBool(JNIEnv *env, jobject unistylesModule, std::string name, std::string sig, bool param) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jfieldID platformFieldId = env->GetFieldID(cls, "platform", "Lcom/unistyles/Platform;");
    jobject platformInstance = env->GetObjectField(unistylesModule, platformFieldId);
    jclass platformClass = env->GetObjectClass(platformInstance);
    jmethodID methodId = env->GetMethodID(platformClass, name.c_str(), sig.c_str());

    env->CallVoidMethod(platformInstance, methodId, param);
    env->DeleteLocalRef(cls);
    env->DeleteLocalRef(platformInstance);
    env->DeleteLocalRef(platformClass);
}

jobject JNI_callPlatform(JNIEnv *env, jobject unistylesModule, std::string name, std::string sig) {
    jclass cls = env->GetObjectClass(unistylesModule);
    jfieldID platformFieldId = env->GetFieldID(cls, "platform", "Lcom/unistyles/Platform;");
    jobject platformInstance = env->GetObjectField(unistylesModule, platformFieldId);
    jclass platformClass = env->GetObjectClass(platformInstance);
    jmethodID methodId = env->GetMethodID(platformClass, name.c_str(), sig.c_str());
    jobject result = env->CallObjectMethod(platformInstance, methodId);

    env->DeleteLocalRef(cls);
    env->DeleteLocalRef(platformInstance);
    env->DeleteLocalRef(platformClass);

    return result;
}

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
