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

#import "react/nativemodule/microtasks/NativeMicrotasks.h"

FOUNDATION_EXPORT double react_nativemodule_microtasksVersionNumber;
FOUNDATION_EXPORT const unsigned char react_nativemodule_microtasksVersionString[];

