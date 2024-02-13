#include <jni.h>
#include <string>
#include <map>

int jobjectToInt(JNIEnv *env, jobject integer);
std::string jstringToStdString(JNIEnv *env, jstring jStr);
std::map<std::string, int> jobjectToStdMap(JNIEnv *env, jobject map);

void throwKotlinException(JNIEnv *env, const char *message);
