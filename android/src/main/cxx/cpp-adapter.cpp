#include <jni.h>

// JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
//     HybridObjectRegistry::registerHybridObjectConstructor("UnistylesRuntime", []() -> std::shared_ptr<HybridObject>{
//         return std::make_shared<HybridUnistylesRuntime>();
//     });
//     HybridObjectRegistry::registerHybridObjectConstructor("StatusBar", []() -> std::shared_ptr<HybridObject>{
//         return std::make_shared<HybridStatusBar>();
//     });
//     HybridObjectRegistry::registerHybridObjectConstructor("NavigationBar", []() -> std::shared_ptr<HybridObject>{
//         return std::make_shared<HybridNavigationBar>();
//     });
//
//     return JNI_VERSION_1_2;
// }

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    return margelo::nitro::math::initialize(vm);
}
