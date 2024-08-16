import Foundation

public class NativePlatform {
    // todo, create based on platform
    public static func create() -> HybridNativePlatformSpecCxx {
        let nativePlatform = NativeIOSPlatform()

        return HybridNativePlatformSpecCxx(nativePlatform)
    }
}
