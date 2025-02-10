package com.unistyles

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowManager
import androidx.annotation.Keep
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.unistyles.Insets
import com.margelo.nitro.unistyles.UnistyleDependency
import com.margelo.nitro.unistyles.UnistylesNativeMiniRuntime

typealias CxxImeListener = (miniRuntime: UnistylesNativeMiniRuntime) -> Unit

@Keep
@DoNotStrip
class NativePlatformInsets(
    private val reactContext: ReactApplicationContext,
    private val getMiniRuntime: () -> UnistylesNativeMiniRuntime,
    private val diffMiniRuntime: () -> Array<UnistyleDependency>
) {
    private val _imeListeners: MutableList<CxxImeListener> = mutableListOf()
    private var _insets: Insets = Insets(0.0, 0.0, 0.0, 0.0, 0.0)

    init {
        // get initial insets
        reactContext.currentActivity?.let { activity ->
            val insets = ViewCompat.getRootWindowInsets(activity.window.decorView)

            insets?.let { windowInsets ->
                setInsets(windowInsets, activity.window, null, true)
            }
        }
    }

    fun onDestroy() {
        this.removeImeListeners()
    }

    fun getInsets(): Insets {
        val density = reactContext.resources.displayMetrics.density

        return Insets(
            this._insets.top / density,
            this._insets.bottom / density,
            this._insets.left / density,
            this._insets.right / density,
            this._insets.ime / density
        )
    }

    fun setInsets(insetsCompat: WindowInsetsCompat, window: Window, animatedBottomInsets: Double?, skipUpdate: Boolean = false) {
        // below Android 11, we need to use window flags to detect status bar visibility
        val isStatusBarVisible = when(Build.VERSION.SDK_INT) {
            in 30..Int.MAX_VALUE -> {
                insetsCompat.isVisible(WindowInsetsCompat.Type.statusBars())
            }
            else -> {
                @Suppress("DEPRECATION")
                window.attributes.flags and WindowManager.LayoutParams.FLAG_FULLSCREEN != WindowManager.LayoutParams.FLAG_FULLSCREEN
            }
        }
        // React Native is forcing insets to make status bar translucent
        // so we need to calculate top inset manually, as WindowInsetCompat will always return 0
        val statusBarTopInset = when(isStatusBarVisible) {
            true -> {
                val visibleRect = Rect()

                window.decorView.getWindowVisibleDisplayFrame(visibleRect)

                visibleRect.top
            }
            false -> 0
        }

        val insets = insetsCompat.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())

        // Android 10 and below - set bottom insets to 0 while keyboard is visible and use default bottom insets otherwise
        // Android 11 and above - animate bottom insets while keyboard is appearing and disappearing
        val imeInsets = when {
            animatedBottomInsets != null && Build.VERSION.SDK_INT >= 30 -> animatedBottomInsets
            Build.VERSION.SDK_INT < 30 -> {
                val nextBottomInset = insetsCompat.getInsets(WindowInsetsCompat.Type.ime()).bottom - insets.bottom
                maxOf(nextBottomInset, 0).toDouble()
            }
            else -> 0.0
        }

        val shouldEmitImeEvent = Build.VERSION.SDK_INT < 30 && imeInsets != this._insets.ime || animatedBottomInsets != null && Build.VERSION.SDK_INT >= 30

        this._insets = Insets(
            statusBarTopInset.toDouble(),
            insets.bottom.toDouble(),
            insets.left.toDouble(),
            insets.right.toDouble(),
            imeInsets
        )

        if (skipUpdate) {
            return
        }

        diffMiniRuntime()

        if (shouldEmitImeEvent) {
            this@NativePlatformInsets.emitImeEvent(this.getMiniRuntime())
        }
    }

    fun startInsetsListener() {
        reactContext.currentActivity?.let { activity ->
            activity.findViewById<View>(android.R.id.content)?.let { mainView ->
                ViewCompat.setOnApplyWindowInsetsListener(mainView) { _, insets ->
                    setInsets(insets, activity.window, null)

                    insets
                }

                // IME insets are available from Android 11
                if (Build.VERSION.SDK_INT >= 30) {
                    ViewCompat.setWindowInsetsAnimationCallback(
                        mainView,
                        object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_STOP) {
                            override fun onProgress(
                                insets: WindowInsetsCompat,
                                runningAnimations: List<WindowInsetsAnimationCompat>
                            ): WindowInsetsCompat {
                                runningAnimations.firstOrNull()?.let {
                                    val bottomInset = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom.toDouble() - this@NativePlatformInsets._insets.bottom
                                    val nextBottomInset = if (bottomInset < 0) {
                                        0.0
                                    } else {
                                        bottomInset
                                    }

                                    this@NativePlatformInsets.setInsets(insets, activity.window, nextBottomInset)
                                }

                                return insets
                            }
                        }
                    )
                }
            }
        }
    }

    fun emitImeEvent(miniRuntime: UnistylesNativeMiniRuntime) {
        _imeListeners.forEach { listener ->
            listener(miniRuntime)
        }
    }

    fun stopInsetsListener() {
        reactContext.currentActivity?.let { activity ->
            activity.window?.decorView?.let { view ->
                ViewCompat.setOnApplyWindowInsetsListener(view, null)
                ViewCompat.setWindowInsetsAnimationCallback(view, null)
            }
        }
    }

    fun addImeListener(listener: CxxImeListener) {
        this._imeListeners.add(listener)
    }

    fun removeImeListeners() {
        this._imeListeners.clear()
    }
}
