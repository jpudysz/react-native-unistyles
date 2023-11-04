#import "UnistylesHelpers.h"
#import "UnistylesRuntime.h"

std::string getColorScheme() {
    UIUserInterfaceStyle colorScheme = [UIScreen mainScreen].traitCollection.userInterfaceStyle;

    switch (colorScheme) {
        case UIUserInterfaceStyleLight:
            return UnistylesLightScheme;
        case UIUserInterfaceStyleDark:
            return UnistylesDarkScheme;
        case UIUserInterfaceStyleUnspecified:
        default:
            return UnistylesUnspecifiedScheme;
    }
}

NSString* cxxStringToNSString(std::string cxxString) {
    return [NSString stringWithUTF8String:cxxString.c_str()];
}
