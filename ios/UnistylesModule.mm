#import "UnistylesModule.h"
#import "UnistylesRuntime.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <jsi/jsi.h>

@implementation UnistylesModule

BOOL hasListeners;

using namespace facebook;

RCT_EXPORT_MODULE(Unistyles)

- (instancetype)init {
    if ((self = [super init])) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleOrientationChange:)
                                                     name:UIDeviceOrientationDidChangeNotification
                                                   object:nil];
    }
    return self;
}

- (void)handleOrientationChange:(NSNotification *)notification {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;
        CGFloat screenHeight = [UIScreen mainScreen].bounds.size.height;

        ((UnistylesRuntime*)self.unistylesRuntime)->handleScreenSizeChange(screenWidth, screenHeight);
    });
}

- (void)dealloc {
    delete (UnistylesRuntime*)self.unistylesRuntime;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
    NSLog(@"Installing Unistyles 🦄...");

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

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onChange"];
}

- (void)startObserving
{
    hasListeners = YES;
}

- (void)stopObserving
{
    hasListeners = NO;
}

- (void)emitEvent:(NSString *)eventName withBody:(NSDictionary *)body {
    if (hasListeners) {
        [self sendEventWithName:@"onChange" body:body];
    }
}

void registerUnistylesHostObject(jsi::Runtime &runtime, UnistylesModule* weakSelf) {
    CGFloat initialScreenWidth = [UIScreen mainScreen].bounds.size.width;
    CGFloat initialScreenHeight = [UIScreen mainScreen].bounds.size.height;
    UnistylesEventHandler eventHandler = ^(NSDictionary *body) {
        [weakSelf emitEvent:@"onChange" withBody:body];
    };
    
    auto unistylesRuntime = std::make_shared<UnistylesRuntime>(eventHandler, initialScreenWidth, initialScreenHeight);
    
    weakSelf.unistylesRuntime = unistylesRuntime.get();

    auto hostObject = jsi::Object::createFromHostObject(runtime, unistylesRuntime);
 
    runtime.global().setProperty(runtime, "__UNISTYLES__", std::move(hostObject));
}

@end
