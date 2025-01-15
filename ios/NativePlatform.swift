import Foundation

enum PlatformError: Error {
    case UnsupportedPlatform
}

public class NativePlatform {
    public static func create() -> HybridNativePlatformSpec_cxx {
        #if os(iOS)
        let nativePlatform = NativeIOSPlatform()
        #else
        throw PlatformError.UnsupportedPlatform
        #endif

        return HybridNativePlatformSpec_cxx(nativePlatform);
    }
}
