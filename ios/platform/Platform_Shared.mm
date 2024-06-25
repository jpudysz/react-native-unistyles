#if TARGET_OS_TV || TARGET_OS_VISION || TARGET_OS_IOS

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

// based on Apple Human Interface Guidelines
// https://developer.apple.com/design/human-interface-guidelines/typography#Specifications
float getFontScale() {
    UIContentSizeCategory contentSizeCategory = [[UIApplication sharedApplication] preferredContentSizeCategory];
    float defaultMultiplier = 17.0;

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraExtraExtraLarge]) {
        return 23.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraExtraLarge]) {
        return 21.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraLarge]) {
        return 19.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryLarge]) {
        return 17.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryMedium]) {
        return 16.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategorySmall]) {
        return 15.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryExtraSmall]) {
        return 14.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityMedium]) {
        return 29.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityLarge]) {
        return 33.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraLarge]) {
        return 40.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraExtraLarge]) {
        return 47.0 / defaultMultiplier;
    }

    if ([contentSizeCategory isEqualToString:UIContentSizeCategoryAccessibilityExtraExtraExtraLarge]) {
        return 53.0 / defaultMultiplier;
    }

    return 1.0;
}

std::string getColorScheme() {
    #if !TARGET_OS_VISION
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
    #endif
    
    return UnistylesUnspecifiedScheme;
}

UIColor* colorFromHexString(NSString* hexString, float alpha) {
    unsigned rgbValue = 0;
    unsigned alphaValue = 0xFF;

    NSScanner *scanner = [NSScanner scannerWithString:hexString];

    if (![hexString hasPrefix:@"#"]) {
        return nil;
    }

    [scanner setScanLocation:1];

    if ((hexString.length == 9 && ![scanner scanHexInt:&alphaValue]) || ![scanner scanHexInt:&rgbValue]) {
        return nil;
    }

    if (hexString.length == 9) {
        alpha = alphaValue / 255.0;
    }

    return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
                    green:((rgbValue & 0x00FF00) >> 8) / 255.0
                    blue:(rgbValue & 0x0000FF) / 255.0
                    alpha:alpha];
}

#endif
