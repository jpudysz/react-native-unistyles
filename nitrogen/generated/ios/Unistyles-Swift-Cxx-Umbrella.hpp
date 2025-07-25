///
/// Unistyles-Swift-Cxx-Umbrella.hpp
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2025 Marc Rousavy @ Margelo
///

#pragma once

// Forward declarations of C++ defined types
// Forward declaration of `ColorScheme` to properly resolve imports.
namespace margelo::nitro::unistyles { enum class ColorScheme; }
// Forward declaration of `Dimensions` to properly resolve imports.
namespace margelo::nitro::unistyles { struct Dimensions; }
// Forward declaration of `HybridNativePlatformSpec` to properly resolve imports.
namespace margelo::nitro::unistyles { class HybridNativePlatformSpec; }
// Forward declaration of `Insets` to properly resolve imports.
namespace margelo::nitro::unistyles { struct Insets; }
// Forward declaration of `Orientation` to properly resolve imports.
namespace margelo::nitro::unistyles { enum class Orientation; }
// Forward declaration of `UnistyleDependency` to properly resolve imports.
namespace margelo::nitro::unistyles { enum class UnistyleDependency; }
// Forward declaration of `UnistylesNativeMiniRuntime` to properly resolve imports.
namespace margelo::nitro::unistyles { struct UnistylesNativeMiniRuntime; }

// Include C++ defined types
#include "ColorScheme.hpp"
#include "Dimensions.hpp"
#include "HybridNativePlatformSpec.hpp"
#include "Insets.hpp"
#include "Orientation.hpp"
#include "UnistyleDependency.hpp"
#include "UnistylesNativeMiniRuntime.hpp"
#include <NitroModules/Result.hpp>
#include <exception>
#include <functional>
#include <memory>
#include <string>
#include <vector>

// C++ helpers for Swift
#include "Unistyles-Swift-Cxx-Bridge.hpp"

// Common C++ types used in Swift
#include <NitroModules/ArrayBufferHolder.hpp>
#include <NitroModules/AnyMapUtils.hpp>
#include <NitroModules/RuntimeError.hpp>
#include <NitroModules/DateToChronoDate.hpp>

// Forward declarations of Swift defined types
// Forward declaration of `HybridNativePlatformSpec_cxx` to properly resolve imports.
namespace Unistyles { class HybridNativePlatformSpec_cxx; }

// Include Swift defined types
#if __has_include("Unistyles-Swift.h")
// This header is generated by Xcode/Swift on every app build.
// If it cannot be found, make sure the Swift module's name (= podspec name) is actually "Unistyles".
#include "Unistyles-Swift.h"
// Same as above, but used when building with frameworks (`use_frameworks`)
#elif __has_include(<Unistyles/Unistyles-Swift.h>)
#include <Unistyles/Unistyles-Swift.h>
#else
#error Unistyles's autogenerated Swift header cannot be found! Make sure the Swift module's name (= podspec name) is actually "Unistyles", and try building the app first.
#endif
