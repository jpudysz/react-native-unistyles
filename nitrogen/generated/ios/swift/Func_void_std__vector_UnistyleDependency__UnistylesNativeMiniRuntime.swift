///
/// Func_void_std__vector_UnistyleDependency__UnistylesNativeMiniRuntime.swift
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules

/**
 * Wraps a Swift `(_ dependencies: [UnistyleDependency], _ miniRuntime: UnistylesNativeMiniRuntime) -> Void` as a class.
 * This class can be used from C++, e.g. to wrap the Swift closure as a `std::function`.
 */
public final class Func_void_std__vector_UnistyleDependency__UnistylesNativeMiniRuntime {
  public typealias bridge = margelo.nitro.unistyles.bridge.swift

  private let closure: (_ dependencies: [UnistyleDependency], _ miniRuntime: UnistylesNativeMiniRuntime) -> Void

  public init(_ closure: @escaping (_ dependencies: [UnistyleDependency], _ miniRuntime: UnistylesNativeMiniRuntime) -> Void) {
    self.closure = closure
  }

  @inline(__always)
  public func call(dependencies: bridge.std__vector_UnistyleDependency_, miniRuntime: UnistylesNativeMiniRuntime) -> Void {
    self.closure(dependencies.map({ __item in __item }), miniRuntime)
  }

  /**
   * Casts this instance to a retained unsafe raw pointer.
   * This acquires one additional strong reference on the object!
   */
  @inline(__always)
  public func toUnsafe() -> UnsafeMutableRawPointer {
    return Unmanaged.passRetained(self).toOpaque()
  }

  /**
   * Casts an unsafe pointer to a `Func_void_std__vector_UnistyleDependency__UnistylesNativeMiniRuntime`.
   * The pointer has to be a retained opaque `Unmanaged<Func_void_std__vector_UnistyleDependency__UnistylesNativeMiniRuntime>`.
   * This removes one strong reference from the object!
   */
  @inline(__always)
  public static func fromUnsafe(_ pointer: UnsafeMutableRawPointer) -> Func_void_std__vector_UnistyleDependency__UnistylesNativeMiniRuntime {
    return Unmanaged<Func_void_std__vector_UnistyleDependency__UnistylesNativeMiniRuntime>.fromOpaque(pointer).takeRetainedValue()
  }
}
