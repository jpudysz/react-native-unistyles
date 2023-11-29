cmake_minimum_required(VERSION 3.9.0)

project(unistyles)

add_library(unistyles
    SHARED
    ../cxx/UnistylesRuntime.cpp
    ../node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp
)

include_directories(
    ../cxx
    ../node_modules/react-native/React
    ../node_modules/react-native/React/Base
    ../node_modules/react-native/ReactCommon/jsi
)

set_target_properties(unistyles PROPERTIES
    CXX_STANDARD 17
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
    POSITION_INDEPENDENT_CODE ON
)

target_link_libraries(unistyles
    android
)
