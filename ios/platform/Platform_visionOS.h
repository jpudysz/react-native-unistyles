#include <string>
#include <map>
#import <UIKit/UIKit.h>
#import "Platform_Shared.h"

@interface Platform : NSObject

@property (nonatomic, assign) void* unistylesRuntime;

- (instancetype)init;

- (void)setupListeners;
- (void)makeShared:(void*)runtime;
- (UIWindow *)getMainWindow;
- (void)onContentSizeCategoryChange:(NSNotification *)notification;
- (void)onWindowChange:(NSNotification *)notification;

@end

