#if __has_include("Unistyles-Swift-Cxx-Umbrella.hpp")
    #include "Unistyles-Swift-Cxx-Umbrella.hpp"
#elif __has_include("JHybridNativePlatformSpec.hpp")
    #include "JHybridNativePlatformSpec.hpp"

    namespace Unistyles {
        using HybridNativePlatformSpecCxx = margelo::nitro::unistyles::JHybridNativePlatformSpec;
    }
#else
    #error "Unistyles: Can't find platform specific header!"
#endif
