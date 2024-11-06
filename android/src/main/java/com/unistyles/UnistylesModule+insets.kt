import com.facebook.react.bridge.ReactApplicationContext
import com.margelo.nitro.unistyles.Insets

class UnistylesModuleInsets(private val reactContext: ReactApplicationContext) {
    fun getInsets(): Insets {
        return Insets(top = 0.0, bottom = 0.0, left = 0.0, right = 0.0, ime = 0.0)
    }
}
