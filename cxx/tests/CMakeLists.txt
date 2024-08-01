cmake_minimum_required(VERSION 3.22)
project(unistyles-tests)

set(CMAKE_CXX_STANDARD 20)
set(UNISTYLES_SRC_DIR "${CMAKE_SOURCE_DIR}/..")
set(HERMES_SRC_DIR "${CMAKE_SOURCE_DIR}/hermes")
set(HERMES_BUILD_DIR "${CMAKE_SOURCE_DIR}/hermes-debug")

include_directories("${HERMES_SRC_DIR}/API")
include_directories("${HERMES_SRC_DIR}/API/jsi")
include_directories("${HERMES_SRC_DIR}/public")

link_directories("${HERMES_BUILD_DIR}/API/hermes")
link_directories("${HERMES_BUILD_DIR}/jsi")

include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.6.0
)

FetchContent_Declare(
    folly
    GIT_REPOSITORY https://github.com/facebook/folly.git
    GIT_TAG v2024.07.29.00
)

FetchContent_MakeAvailable(Catch2)
FetchContent_MakeAvailable(folly)

file(GLOB TEST_FILES "${CMAKE_SOURCE_DIR}/*.cpp")
file(GLOB UNISTYLES_FILES "${UNISTYLES_SRC_DIR}/*.h" "${UNISTYLES_SRC_DIR}/*.cpp")

include_directories(${UNISTYLES_FILES})

add_executable(unistyles-tests ${TEST_FILES})
target_link_libraries(unistyles-tests hermes jsi folly Catch2::Catch2WithMain)

include(CTest)
include(Catch)
catch_discover_tests(unistyles-tests)