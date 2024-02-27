#import "UnistylesModule.h"
#import "UnistylesHelpers.h"
#import "UnistylesRuntime.h"

#import <React/RCTBridge+Private.h>
#import <jsi/jsi.h>

using namespace facebook;

@implementation UnistylesModule

RCT_EXPORT_MODULE(Unistyles)

#pragma mark - Lifecycle

- (instancetype)init {
    if ((self = [super init])) {
        self.platform = [[Platform alloc] init];
    }

    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

#pragma mark - Event emitter
- (NSArray<NSString *> *)supportedEvents {
    return @[@"__unistylesOnChange"];
}

- (void)startObserving {
    self.hasListeners = YES;
}

- (void)stopObserving {
    self.hasListeners = NO;
}

- (void)emitEvent:(NSString *)eventName withBody:(NSDictionary *)body {
    if (self.hasListeners) {
        [self sendEventWithName:@"__unistylesOnChange" body:body];
    }
}

#pragma mark - Core

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
    RCTBridge* bridge = [RCTBridge currentBridge];
    RCTCxxBridge* cxxBridge = (RCTCxxBridge*)bridge;

    if (cxxBridge == nil) {
        return @false;
    }

    auto jsiRuntime = (jsi::Runtime*)cxxBridge.runtime;

    if (jsiRuntime == nil) {
        return @false;
    }

    auto& runtime = *jsiRuntime;
    UnistylesModule *__weak weakSelf = self;

    registerUnistylesHostObject(runtime, weakSelf);

    NSLog(@"Installed Unistyles 🦄!");

    return @true;
}

void registerUnistylesHostObject(jsi::Runtime &runtime, UnistylesModule* weakSelf) {
    auto unistylesRuntime = std::make_shared<UnistylesRuntime>(
        weakSelf.platform.initialScreen,
        weakSelf.platform.initialColorScheme,
        weakSelf.platform.initialContentSizeCategory,
        weakSelf.platform.initialInsets,
        weakSelf.platform.initialStatusBar,
        weakSelf.platform.initialNavigationBar
    );

    unistylesRuntime.get()->onThemeChange([=](std::string theme) {
        NSDictionary *body = @{
            @"type": @"theme",
            @"payload": @{
                @"themeName": cxxStringToNSString(theme)
            }
        };

        [weakSelf emitEvent:@"__unistylesOnChange" withBody:body];
    });

    unistylesRuntime.get()->onLayoutChange([=](std::string breakpoint, std::string orientation, Dimensions& screen, Dimensions& statusBar, Insets& insets, Dimensions& navigationBar) {
        NSDictionary *body = @{
            @"type": @"layout",
            @"payload": @{
                @"breakpoint": cxxStringToNSString(breakpoint),
                @"orientation": cxxStringToNSString(orientation),
                @"screen": @{
                    @"width": @(screen.width),
                    @"height": @(screen.height)
                },
                @"statusBar": @{
                    @"width": @(statusBar.width),
                    @"height": @(statusBar.height)
                },
                @"navigationBar": @{
                    @"width": @(navigationBar.width),
                    @"height": @(navigationBar.height)
                },
                @"insets": @{
                    @"top": @(insets.top),
                    @"bottom": @(insets.bottom),
                    @"left": @(insets.left),
                    @"right": @(insets.right)
                }
            }
        };

        [weakSelf emitEvent:@"__unistylesOnChange" withBody:body];
    });
    
    unistylesRuntime.get()->onPluginChange([=]() {
        NSDictionary *body = @{
            @"type": @"plugin"
        };

        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [weakSelf emitEvent:@"__unistylesOnChange" withBody:body];
        });
    });
    
    unistylesRuntime.get()->onContentSizeCategoryChange([=](std::string contentSizeCategory) {
        NSDictionary *body = @{
            @"type": @"dynamicTypeSize",
            @"payload": @{
                @"contentSizeCategory": cxxStringToNSString(contentSizeCategory)
            }
        };

        [weakSelf emitEvent:@"__unistylesOnChange" withBody:body];
    });

    weakSelf.platform.unistylesRuntime = unistylesRuntime.get();

    auto hostObject = jsi::Object::createFromHostObject(runtime, unistylesRuntime);

    runtime.global().setProperty(runtime, "__UNISTYLES__", std::move(hostObject));
}

@end

#pragma mark - End
