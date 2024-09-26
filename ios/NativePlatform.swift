import Foundation

enum PlatformError: Error {
    case UnsupportedPlatform
}

public class NativePlatform {
    public static func create() -> HybridNativePlatformSpecCxx {
        #if os(iOS)
        let nativePlatform = NativeIOSPlatform()
        #else
        throw PlatformError.UnsupportedPlatform
        #endif

        return HybridNativePlatformSpecCxx(nativePlatform)
    }
}
