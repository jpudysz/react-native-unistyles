#include <string>
#include <map>
#include <UnistylesRuntime.h>
#include "Platform_Shared.h"

@interface Platform : NSObject

@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)makeShared:(void*)runtime;
- (void)onWindowChange:(NSNotification *)notification;
- (void)onAppearanceChange:(NSNotification *)notification;
- (void)onContentSizeCategoryChange:(NSNotification *)notification;
- (void)setStatusBarHidden:(bool)isHidden;
- (void)setRootViewBackgroundColor:(std::string)color alpha:(float)alpha;

@end
