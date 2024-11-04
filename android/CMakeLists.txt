cmake_minimum_required(VERSION 3.9.0)

project(unistyles)

file(GLOB_RECURSE CORE_SRC RELATIVE ${CMAKE_SOURCE_DIR} "../cxx/**/*.cpp")
file(GLOB_RECURSE PLATFORM_SRC RELATIVE ${CMAKE_SOURCE_DIR} "./src/main/cxx/*.cpp")

add_library(unistyles
    SHARED
    ${CORE_SRC}
    ${PLATFORM_SRC}
)

include_directories(
    ./src/main/cxx
    ../cxx
    ../cxx/common
    ../cxx/core
    ../cxx/hybridObjects
    ../cxx/parser
    ../cxx/shadowTree
)
include("${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/unistyles+autolinking.cmake")

string(APPEND CMAKE_CXX_FLAGS "-DFOLLY_NO_CONFIG")

set_target_properties(unistyles PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
    POSITION_INDEPENDENT_CODE ON
)

# todo included by nitrogen
# find_package(ReactAndroid REQUIRED CONFIG)
# find_package(fbjni REQUIRED CONFIG)

if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)
    # target_link_libraries(unistyles ReactAndroid::reactnative)
else()
    target_link_libraries(unistyles
        ReactAndroid::turbomodulejsijni
        # ReactAndroid::react_nativemodule_core
        android
        fbjni::fbjni
    )
endif()
