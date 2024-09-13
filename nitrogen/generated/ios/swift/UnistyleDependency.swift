///
/// UnistyleDependency.swift
/// Fri Sep 13 2024
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

/**
 * Represents the JS enum `UnistyleDependency`, backed by a C++ enum.
 */
public typealias UnistyleDependency = margelo.nitro.unistyles.UnistyleDependency

public extension UnistyleDependency {
  /**
   * Get a UnistyleDependency for the given String value, or
   * return `nil` if the given value was invalid/unknown.
   */
  init?(fromString string: String) {
    switch string {
      case "Theme":
        self = .theme
      case "Breakpoints":
        self = .breakpoints
      case "Variants":
        self = .variants
      case "CompoundVariants":
        self = .compoundvariants
      case "ColorScheme":
        self = .colorscheme
      case "Rtl":
        self = .rtl
      case "Dimensions":
        self = .dimensions
      case "Orientation":
        self = .orientation
      case "ThemeName":
        self = .themename
      case "ContentSizeCategory":
        self = .contentsizecategory
      case "Insets":
        self = .insets
      case "PixelRatio":
        self = .pixelratio
      case "FontScale":
        self = .fontscale
      default:
        return nil
    }
  }

  /**
   * Get the String value this UnistyleDependency represents.
   */
  var stringValue: String {
    switch self {
      case .theme:
        return "Theme"
      case .breakpoints:
        return "Breakpoints"
      case .variants:
        return "Variants"
      case .compoundvariants:
        return "CompoundVariants"
      case .colorscheme:
        return "ColorScheme"
      case .rtl:
        return "Rtl"
      case .dimensions:
        return "Dimensions"
      case .orientation:
        return "Orientation"
      case .themename:
        return "ThemeName"
      case .contentsizecategory:
        return "ContentSizeCategory"
      case .insets:
        return "Insets"
      case .pixelratio:
        return "PixelRatio"
      case .fontscale:
        return "FontScale"
    }
  }
}
