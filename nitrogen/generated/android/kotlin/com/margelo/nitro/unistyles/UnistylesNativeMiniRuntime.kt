///
/// UnistylesNativeMiniRuntime.kt
/// This file was generated by nitrogen. DO NOT MODIFY THIS FILE.
/// https://github.com/mrousavy/nitro
/// Copyright © 2024 Marc Rousavy @ Margelo
///

package com.margelo.nitro.unistyles

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip

/**
 * Represents the JavaScript object/struct "UnistylesNativeMiniRuntime".
 */
@DoNotStrip
@Keep
data class UnistylesNativeMiniRuntime(
  val colorScheme: ColorScheme,
  val screen: Dimensions,
  val contentSizeCategory: String,
  val insets: Insets,
  val pixelRatio: Double,
  val fontScale: Double,
  val rtl: Boolean,
  val statusBar: Dimensions,
  val navigationBar: Dimensions,
  val orientation: Orientation
)