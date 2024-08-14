#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "react/nativemodule/idlecallbacks/NativeIdleCallbacks.h"

FOUNDATION_EXPORT double react_nativemodule_idlecallbacksVersionNumber;
FOUNDATION_EXPORT const unsigned char react_nativemodule_idlecallbacksVersionString[];

