#pragma once

#include <jni.h>
#include <string>
#include <map>
#include <UnistylesRuntime.h>

Dimensions jobjectToDimensions(JNIEnv *env, jobject dimensionObj);
Screen jobjectToScreen(JNIEnv *env, jobject screenObj);
Insets jobjectToInsets(JNIEnv *env, jobject insetsObj);

void throwKotlinException(JNIEnv *env, const char *message);
