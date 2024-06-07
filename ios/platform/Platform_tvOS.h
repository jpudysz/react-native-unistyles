#include <string>
#include <map>
#include "Platform_Shared.h"

@interface Platform : NSObject

@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)makeShared:(void*)runtime;
- (void)onAppearanceChange:(NSNotification *)notification;
- (void)onContentSizeCategoryChange:(NSNotification *)notification;

@end

