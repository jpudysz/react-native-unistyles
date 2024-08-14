#include <jni.h>

#include <NitroModules/HybridObjectRegistry.hpp>
#include <HybridUnistylesRuntime.h>
#include <HybridStatusBar.h>
#include <HybridNavigationBar.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridUnistylesRuntime>();
    });
    HybridObjectRegistry::registerHybridObjectConstructor("StatusBar", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridStatusBar>();
    });
    HybridObjectRegistry::registerHybridObjectConstructor("NavigationBar", []() -> std::shared_ptr<HybridObject>{
        return std::make_shared<HybridNavigationBar>();
    });

    return JNI_VERSION_1_2;
}

//using namespace facebook;
//
//static jobject unistylesModule = nullptr;
//std::shared_ptr<UnistylesRuntime> unistylesRuntime = nullptr;
//
//extern "C"
//JNIEXPORT void JNICALL
//Java_com_unistyles_UnistylesModule_nativeInstall(JNIEnv *env, jobject thiz, jlong jsi, jobject callInvokerHolder) {
//    auto runtime = reinterpret_cast<jsi::Runtime *>(jsi);
//    auto callInvoker{
//        jni::alias_ref<react::CallInvokerHolder::javaobject>{ reinterpret_cast<react::CallInvokerHolder::javaobject>(callInvokerHolder)} -> cthis() ->getCallInvoker()
//    };
//
//    if (unistylesModule == nullptr) {
//        unistylesModule = env->NewGlobalRef(thiz);
//    }
//
//    if (unistylesModule == nullptr) {
//        return throwKotlinException(env, "Something went wrong while initializing UnistylesModule");
//    }
//
//    unistylesRuntime = std::make_shared<UnistylesRuntime>(*runtime, callInvoker);
//    auto styleSheet = std::make_shared<StyleSheet>(*runtime, unistylesRuntime);
//
//    makeShared(env, unistylesModule, unistylesRuntime);
//
//    jsi::Object hostObject = jsi::Object::createFromHostObject(*runtime, unistylesRuntime);
//    jsi::Object styleSheetHostObject = jsi::Object::createFromHostObject(*runtime, styleSheet);
//    runtime->global().setProperty(*runtime, "__UNISTYLES__", std::move(hostObject));
//    runtime->global().setProperty(*runtime, "__UNISTYLES__STYLESHEET__", std::move(styleSheetHostObject));
//}
//
//extern "C"
//JNIEXPORT void JNICALL
//Java_com_unistyles_UnistylesModule_nativeDestroy(JNIEnv *env, jobject thiz) {
//    unistylesRuntime.reset();
//    unistylesModule = nullptr;
//}
//
//extern "C"
//JNIEXPORT void JNICALL
//Java_com_unistyles_UnistylesModule_nativeOnOrientationChange(JNIEnv *env, jobject thiz, jobject screen, jobject insets, jobject statusBar, jobject navigationBar) {
//    if (unistylesRuntime != nullptr) {
//        Screen screenDimensions = jobjectToScreen(env, screen);
//        Dimensions statusBarDimensions = jobjectToDimensions(env, statusBar);
//        Insets screenInsets = jobjectToInsets(env, insets);
//        Dimensions navigationBarDimensions = jobjectToDimensions(env, navigationBar);
//
//        unistylesRuntime->handleScreenSizeChange(screenDimensions, screenInsets, statusBarDimensions, navigationBarDimensions);
//    }
//}
//
//extern "C"
//JNIEXPORT void JNICALL
//Java_com_unistyles_UnistylesModule_nativeOnAppearanceChange(JNIEnv *env, jobject thiz, jstring colorScheme) {
//    if (unistylesRuntime != nullptr) {
//        unistylesRuntime->handleAppearanceChange(env->GetStringUTFChars(colorScheme, nullptr));
//    }
//}
//
//extern "C"
//JNIEXPORT void JNICALL
//Java_com_unistyles_UnistylesModule_nativeOnContentSizeCategoryChange(JNIEnv *env, jobject thiz, jstring contentSizeCategory) {
//    if (unistylesRuntime != nullptr) {
//        unistylesRuntime->handleContentSizeCategoryChange(env->GetStringUTFChars(contentSizeCategory, nullptr));
//    }
//}
