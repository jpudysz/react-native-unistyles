#pragma once

#include "UnistylesRuntime.h"
#include "helpers.h"

void makeShared(JNIEnv *env, jobject unistylesModule, std::shared_ptr<UnistylesRuntime> unistylesRuntime);
Screen getScreenDimensions(JNIEnv *env, jobject unistylesModule);
std::string getColorScheme(JNIEnv *env, jobject unistylesModule);
Dimensions getStatusBarDimensions(JNIEnv *env, jobject unistylesModule);
Dimensions getNavigationBarDimensions(JNIEnv *env, jobject unistylesModule);
void setNavigationBarHidden(JNIEnv *env, jobject unistylesModule, bool hidden);
void setStatusBarHidden(JNIEnv *env, jobject unistylesModule, bool hidden);
void setImmersiveMode(JNIEnv *env, jobject unistylesModule, bool hidden);
void setRootViewBackgroundColor(JNIEnv *env, jobject unistylesModule, std::string color, float alpha);
Insets getInsets(JNIEnv *env, jobject unistylesModule);
bool getIsRTL(JNIEnv *env, jobject unistylesModule);
std::string getContentSizeCategory(JNIEnv *env, jobject unistylesModule);
void setNavigationBarColor(JNIEnv *env, jobject unistylesModule, std::string color, float alpha);
void setStatusBarColor(JNIEnv *env, jobject unistylesModule, std::string color, float alpha);
