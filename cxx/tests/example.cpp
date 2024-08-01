#include <hermes/hermes.h>
#include <catch2/catch_test_macros.hpp>
#include "../Consts.h"
#include "../Helpers.h"

using namespace facebook;

TEST_CASE("Examples tests") {
    const auto runtimeConfig = ::hermes::vm::RuntimeConfig::Builder().withIntl(false).build();
    const auto rt = facebook::hermes::makeHermesRuntime(runtimeConfig);

    SECTION("Has insets style dependency") {
        REQUIRE(static_cast<int>(StyleDependency::Insets) == 3);
    }

    SECTION("Example JSI test") {
        auto obj1 = jsi::Object(*rt);
        auto obj2 = jsi::Object(*rt);

        obj2.setProperty(*rt, facebook::jsi::String::createFromUtf8(*rt, "hello"), jsi::Value(2));

        unistyles::helpers::mergeJSIObjects(*rt, obj1, obj2);

        REQUIRE(static_cast<int>(obj1.getProperty(*rt, jsi::String::createFromUtf8(*rt, "hello")).asNumber()) == 2);
    }
}
