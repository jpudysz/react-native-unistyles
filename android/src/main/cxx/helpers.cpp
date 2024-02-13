#include "helpers.h"

int jobjectToInt(JNIEnv *env, jobject integer) {
    jclass integerClass = env->FindClass("java/lang/Integer");
    jmethodID intValueMethod = env->GetMethodID(integerClass, "intValue", "()I");
    int value = env->CallIntMethod(integer, intValueMethod);

    env->DeleteLocalRef(integerClass);

    return value;
}

std::string jstringToStdString(JNIEnv *env, jstring jStr) {
    if (!jStr) {
        return "";
    }

    const jclass stringClass = env->GetObjectClass(jStr);
    const jmethodID getBytes = env->GetMethodID(stringClass, "getBytes", "(Ljava/lang/String;)[B");
    const jbyteArray stringJbytes = (jbyteArray) env->CallObjectMethod(jStr, getBytes, env->NewStringUTF("UTF-8"));

    size_t length = (size_t) env->GetArrayLength(stringJbytes);
    jbyte* pBytes = env->GetByteArrayElements(stringJbytes, NULL);

    std::string ret = std::string((char *)pBytes, length);
    env->ReleaseByteArrayElements(stringJbytes, pBytes, JNI_ABORT);

    env->DeleteLocalRef(stringJbytes);
    env->DeleteLocalRef(stringClass);

    return ret;
}

std::map<std::string, int> jobjectToStdMap(JNIEnv *env, jobject map) {
    std::map<std::string, int> result;

    jclass setClass = env->FindClass("java/util/Set");
    jclass iteratorClass = env->FindClass("java/util/Iterator");
    jmethodID entrySetMethod = env->GetMethodID(env->GetObjectClass(map), "entrySet", "()Ljava/util/Set;");
    jmethodID iteratorMethod = env->GetMethodID(setClass, "iterator", "()Ljava/util/Iterator;");
    jobject set = env->CallObjectMethod(map, entrySetMethod);
    jobject iterator = env->CallObjectMethod(set, iteratorMethod);
    jmethodID hasNextMethod = env->GetMethodID(iteratorClass, "hasNext", "()Z");
    jmethodID nextMethod = env->GetMethodID(iteratorClass, "next", "()Ljava/lang/Object;");

    while (env->CallBooleanMethod(iterator, hasNextMethod)) {
        jobject entry = env->CallObjectMethod(iterator, nextMethod);

        jmethodID getKeyMethod = env->GetMethodID(env->GetObjectClass(entry), "getKey", "()Ljava/lang/Object;");
        jmethodID getValueMethod = env->GetMethodID(env->GetObjectClass(entry), "getValue", "()Ljava/lang/Object;");
        jstring key = (jstring) env->CallObjectMethod(entry, getKeyMethod);
        jobject value = env->CallObjectMethod(entry, getValueMethod);

        result[jstringToStdString(env, key)] = jobjectToInt(env, value);

        env->DeleteLocalRef(entry);
        env->DeleteLocalRef(key);
        env->DeleteLocalRef(value);
    }

    env->DeleteLocalRef(set);
    env->DeleteLocalRef(iterator);
    env->DeleteLocalRef(setClass);
    env->DeleteLocalRef(iteratorClass);

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
