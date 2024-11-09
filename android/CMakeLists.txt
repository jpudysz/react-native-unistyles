cmake_minimum_required(VERSION 3.9.0)

project(unistyles)

file(GLOB_RECURSE CORE_SRC RELATIVE ${CMAKE_SOURCE_DIR} "../cxx/**/*.cpp")
file(GLOB_RECURSE PLATFORM_SRC RELATIVE ${CMAKE_SOURCE_DIR} "./src/main/cxx/*.cpp")

add_library(unistyles
    SHARED
    ${CORE_SRC}
    ${PLATFORM_SRC}
)

include("${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/unistyles+autolinking.cmake")

include_directories(
    ./src/main/cxx
    ../cxx
    ../cxx/common
    ../cxx/core
    ../cxx/hybridObjects
    ../cxx/parser
    ../cxx/shadowTree
)

string(APPEND CMAKE_CXX_FLAGS "-DFOLLY_NO_CONFIG")

set_target_properties(unistyles PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
    POSITION_INDEPENDENT_CODE ON
)

# For React Native 0.76 and above, we don't need to link anything
# as NitroModules will automatically add ReactAndroid::reactnative prefab
