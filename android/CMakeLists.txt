cmake_minimum_required(VERSION 3.9.0)

project(unistyles)

add_library(unistyles
    SHARED
    ../cxx/UnistylesRuntime.cpp
    ../cxx/UnistylesModel.cpp
    ../cxx/UnistylesImpl.cpp
    ./src/main/cxx/cpp-adapter.cpp
    ./src/main/cxx/helpers.cpp
    ./src/main/cxx/platform.cpp
)

include_directories(
    ../cxx
)

set_target_properties(unistyles PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
    POSITION_INDEPENDENT_CODE ON
)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

target_link_libraries(unistyles
    ReactAndroid::jsi
    ReactAndroid::turbomodulejsijni
    ReactAndroid::react_nativemodule_core
    android
    fbjni::fbjni
)
