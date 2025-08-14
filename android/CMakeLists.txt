cmake_minimum_required(VERSION 3.9.0)

project(unistyles)

file(GLOB_RECURSE CORE_SRC RELATIVE ${CMAKE_SOURCE_DIR} "../cxx/**/*.cpp")
file(GLOB_RECURSE PLATFORM_SRC RELATIVE ${CMAKE_SOURCE_DIR} "./src/main/cxx/*.cpp")

# TODO: remove me with new version of Nitro
if(ReactAndroid_VERSION_MINOR GREATER_EQUAL 80)
    target_compile_reactnative_options(unistyles PRIVATE)
endif()

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

# Nitro appends all Folly Flags, leaving it empty
string(APPEND CMAKE_CXX_FLAGS " ")

set_target_properties(unistyles PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
    POSITION_INDEPENDENT_CODE ON
)

# For React Native 0.76 and above, we don't need to link anything
# as NitroModules will automatically add ReactAndroid::reactnative prefab
if (ReactAndroid_VERSION_MINOR LESS 78)
    message(FATAL_ERROR "Unistyles 3.0 requires min. React Native version to be 0.78")
endif ()
