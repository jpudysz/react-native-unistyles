#pragma once

#include "UnistylesRuntime.h"
#include "helpers.h"

void makeShared(JNIEnv *env, jobject unistylesModule, std::shared_ptr<UnistylesRuntime> unistylesRuntime);
Dimensions getScreenDimensions(JNIEnv *env, jobject unistylesModule);
std::string getColorScheme(JNIEnv *env, jobject unistylesModule);
Dimensions getStatusBarDimensions(JNIEnv *env, jobject unistylesModule);
Dimensions getNavigationBarDimensions(JNIEnv *env, jobject unistylesModule);
Insets getInsets(JNIEnv *env, jobject unistylesModule);
std::string getContentSizeCategory(JNIEnv *env, jobject unistylesModule);

void setNavigationBarColor(JNIEnv *env, jobject unistylesModule, std::string color);
void setStatusBarColor(JNIEnv *env, jobject unistylesModule, std::string color);
