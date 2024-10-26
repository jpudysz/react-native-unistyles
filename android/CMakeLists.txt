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

# REACTNATIVE_MERGED_SO doesnt work as of RN 0.76.0-rc.3
if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
    target_link_libraries(unistyles ReactAndroid::reactnative)
else()
    target_link_libraries(unistyles
        ReactAndroid::turbomodulejsijni
        ReactAndroid::react_nativemodule_core
        android
        fbjni::fbjni
    )
endif()

target_link_libraries(unistyles
    ReactAndroid::jsi
    fbjni::fbjni
)
