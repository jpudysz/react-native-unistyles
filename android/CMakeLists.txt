cmake_minimum_required(VERSION 3.9.0)

project(unistyles)

add_library(unistyles
    SHARED
    ../cxx/HostStyle.cpp
    ../cxx/HybridUnistylesRuntime.cpp
    ../cxx/HybridStatusBar.cpp
    ../cxx/HybridNavigationBar.cpp
    ../cxx/ShadowTreeTraverser.cpp
    ../cxx/StyleSheet.cpp
    ../cxx/StyleSheetImpl.cpp
    ../cxx/StyleSheetRegistry.cpp
    ../cxx/UnistylesImpl.cpp
    ../cxx/UnistylesModel.cpp
    ../cxx/UnistylesRuntime.cpp
    ./src/main/cxx/cpp-adapter.cpp
    ./src/main/cxx/helpers.cpp
    ./src/main/cxx/platform.cpp
)

include_directories(../cxx)
include("${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/Unistyles+autolinking.cmake")

string(APPEND CMAKE_CXX_FLAGS " -DFOLLY_NO_CONFIG")

set_target_properties(unistyles PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
    POSITION_INDEPENDENT_CODE ON
)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

target_include_directories(
    unistyles
    PRIVATE
    "../node_modules/react-native/ReactCommon"
    "../node_modules/react-native/ReactAndroid/src/main/jni/react/turbomodule"
    "../node_modules/react-native/ReactCommon/callinvoker"
    "../node_modules/react-native/ReactCommon/runtimeexecutor"
    "../node_modules/react-native/ReactCommon/yoga"
    "../node_modules/react-native/ReactCommon/react/renderer/graphics/platform/cxx"
)

target_link_libraries(unistyles
    ReactAndroid::jsi
    ReactAndroid::turbomodulejsijni
    ReactAndroid::react_nativemodule_core
    android
    ReactAndroid::react_render_core
    ReactAndroid::runtimeexecutor
    ReactAndroid::fabricjni
    ReactAndroid::react_debug
    ReactAndroid::react_render_core
    ReactAndroid::react_render_componentregistry
    ReactAndroid::rrc_view
    ReactAndroid::folly_runtime
)
