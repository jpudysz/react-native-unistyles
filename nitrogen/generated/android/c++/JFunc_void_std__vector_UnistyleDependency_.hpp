///
/// JFunc_void_std__vector_UnistyleDependency_.hpp
/// Fri Sep 13 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

#pragma once

#include <fbjni/fbjni.h>
#include <functional>

#include <functional>
#include <vector>
#include "UnistyleDependency.hpp"
#include "JUnistyleDependency.hpp"

namespace margelo::nitro::unistyles {

  using namespace facebook;

  /**
   * C++ representation of the callback Func_void_std__vector_UnistyleDependency_.
   * This is a Kotlin `(dependencies: Array<UnistyleDependency>) -> Unit`, backed by a `std::function<...>`.
   */
  struct JFunc_void_std__vector_UnistyleDependency_ final: public jni::HybridClass<JFunc_void_std__vector_UnistyleDependency_> {
  public:
    static jni::local_ref<JFunc_void_std__vector_UnistyleDependency_::javaobject> fromCpp(const std::function<void(const std::vector<UnistyleDependency>& /* dependencies */)>& func) {
      return JFunc_void_std__vector_UnistyleDependency_::newObjectCxxArgs(func);
    }

  public:
    void call(const jni::alias_ref<jni::JArrayClass<JUnistyleDependency>>& dependencies) {
      return _func([&]() {
        size_t size = dependencies->size();
        std::vector<UnistyleDependency> vector;
        vector.reserve(size);
        for (size_t i = 0; i < size; i++) {
          auto element = dependencies->getElement(i);
          vector.push_back(element->toCpp());
        }
        return vector;
      }());
    }

  public:
    static auto constexpr kJavaDescriptor = "Lcom/margelo/nitro/unistyles/Func_void_std__vector_UnistyleDependency_;";
    static void registerNatives() {
      registerHybrid({makeNativeMethod("call", JFunc_void_std__vector_UnistyleDependency_::call)});
    }

  private:
    explicit JFunc_void_std__vector_UnistyleDependency_(const std::function<void(const std::vector<UnistyleDependency>& /* dependencies */)>& func): _func(func) { }

  private:
    friend HybridBase;
    std::function<void(const std::vector<UnistyleDependency>& /* dependencies */)> _func;
  };

} // namespace margelo::nitro::unistyles
