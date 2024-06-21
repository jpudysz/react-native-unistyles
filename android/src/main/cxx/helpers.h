#pragma once

#include <jni.h>
#include <string>
#include <map>
#include <UnistylesRuntime.h>

Dimensions jobjectToDimensions(JNIEnv *env, jobject dimensionObj);
Screen jobjectToScreen(JNIEnv *env, jobject screenObj);
Insets jobjectToInsets(JNIEnv *env, jobject insetsObj);

void JNI_callPlatformWithString(JNIEnv *env, jobject unistylesModule, std::string name, std::string sig, std::string param);
jobject JNI_callPlatform(JNIEnv *env, jobject unistylesModule, std::string name, std::string sig);
void JNI_callPlatformWithBool(JNIEnv *env, jobject unistylesModule, std::string name, std::string sig, bool param);

void throwKotlinException(JNIEnv *env, const char *message);
