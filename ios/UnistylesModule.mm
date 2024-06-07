#import "UnistylesModule.h"
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
    UnistylesModule *__weak weakSelf = self;
    RCTBridge *bridge = self.bridge;
    
    if (bridge == nullptr) {
        return @false;
    }

    registerUnistylesHostObject(bridge, weakSelf);

    NSLog(@"Installed Unistyles 🦄!");

    return @true;
}

void registerUnistylesHostObject(RCTBridge* bridge, UnistylesModule* weakSelf) {
    std::shared_ptr<react::CallInvoker> callInvoker = bridge.jsCallInvoker;
    jsi::Runtime* runtime = reinterpret_cast<jsi::Runtime*>(bridge.runtime);
    auto unistylesRuntime = std::make_shared<UnistylesRuntime>(*runtime, callInvoker);

    [weakSelf.platform makeShared:unistylesRuntime.get()];

    auto hostObject = jsi::Object::createFromHostObject(*runtime, unistylesRuntime);

    runtime->global().setProperty(*runtime, "__UNISTYLES__", std::move(hostObject));
}

@end

#pragma mark - End
