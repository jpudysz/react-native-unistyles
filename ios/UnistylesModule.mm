#import "UnistylesModule.h"
#import "UnistylesHelpers.h"
#import "UnistylesRuntime.h"

#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
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
    auto callInvoker = bridge.jsCallInvoker;
    UnistylesModule *__weak weakSelf = self;

    registerUnistylesHostObject(runtime, callInvoker, weakSelf);

    NSLog(@"Installed Unistyles 🦄!");

    return @true;
}

void registerUnistylesHostObject(jsi::Runtime &runtime, std::shared_ptr<react::CallInvoker> jsCallInvoker, UnistylesModule* weakSelf) {
    auto unistylesRuntime = std::make_shared<UnistylesRuntime>(
        weakSelf.platform.initialScreen,
        weakSelf.platform.initialColorScheme,
        weakSelf.platform.initialContentSizeCategory,
        weakSelf.platform.initialInsets,
        weakSelf.platform.initialStatusBar,
        weakSelf.platform.initialNavigationBar,
        runtime,
        jsCallInvoker
    );

    weakSelf.platform.unistylesRuntime = unistylesRuntime.get();

    auto hostObject = jsi::Object::createFromHostObject(runtime, unistylesRuntime);

    runtime.global().setProperty(runtime, "__UNISTYLES__", std::move(hostObject));
}

@end

#pragma mark - End
