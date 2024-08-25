import Foundation

public class NativePlatform {
    public static func create() -> HybridNativePlatformSpecCxx {
        let nativePlatform = NativeIOSPlatform()

        return HybridNativePlatformSpecCxx(nativePlatform)
    }
}
