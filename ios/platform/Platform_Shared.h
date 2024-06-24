#import <UIKit/UIKit.h>
#import "UnistylesRuntime.h"
#include <string>

std::string getContentSizeCategory();
float getFontScale();
std::string getColorScheme();
UIColor* colorFromHexString(NSString* hexString, float alpha);
