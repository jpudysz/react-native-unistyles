#include "Platform_Shared.h"

std::string getContentSizeCategory() {
    UIContentSizeCategory contentSizeCategory = [[UIApplication sharedApplication] preferredContentSizeCategory];
    
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

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityMedium]) {
        return std::string([@"accessibilityMedium" UTF8String]);
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityLarge]) {
        return std::string([@"accessibilityLarge" UTF8String]);
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraLarge]) {
        return std::string([@"accessibilityExtraLarge" UTF8String]);
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraExtraLarge]) {
        return std::string([@"accessibilityExtraExtraLarge" UTF8String]);
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraExtraExtraLarge]) {
        return std::string([@"accessibilityExtraExtraExtraLarge" UTF8String]);
    }

    return std::string([@"unspecified" UTF8String]);
}

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
