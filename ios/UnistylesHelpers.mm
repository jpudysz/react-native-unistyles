#import "UnistylesHelpers.h"

NSString* cxxStringToNSString(std::string cxxString) {
    return [NSString stringWithUTF8String:cxxString.c_str()];
}
