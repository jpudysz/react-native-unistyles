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

std::string getContentSizeCategory(UIContentSizeCategory contentSizeCategory) {
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraExtraExtraLarge]) {
        return std::string([@"xxxLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraExtraLarge]) {
        return std::string([@"xxLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraLarge]) {
        return std::string([@"xLarge" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryLarge]) {
        return std::string([@"Large" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryMedium]) {
        return std::string([@"Medium" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategorySmall]) {
        return std::string([@"Small" UTF8String]);
    }
    
    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraSmall]) {
        return std::string([@"xSmall" UTF8String]);
    }
    
    return std::string([@"unspecified" UTF8String]);
}

NSString* cxxStringToNSString(std::string cxxString) {
    return [NSString stringWithUTF8String:cxxString.c_str()];
}
