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
