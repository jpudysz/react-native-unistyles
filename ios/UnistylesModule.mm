#import "UnistylesModule.h"

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
    CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;
    CGFloat screenHeight = [UIScreen mainScreen].bounds.size.height;

    NSDictionary *body = @{
        @"type": @"size",
        @"payload": @{
            @"width": @(screenWidth),
            @"height": @(screenHeight)
        }
    };

    [self emitEvent:@"onChange" withBody:body];
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

    registerUnistylesMethods(runtime, weakSelf);

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

- (NSString *)getCurrentBreakpoint:(CGFloat) screenWidth {
    NSString *currentBreakpointKey = nil;

    for (NSInteger index = 0; index < self.sortedBreakpointEntries.count; index++) {
        NSString *breakpointKey = [self.sortedBreakpointEntries objectAtIndex:index];
        NSNumber *minValNum = [self.breakpoints objectForKey:breakpointKey];
        CGFloat minVal = minValNum.floatValue;

        CGFloat maxVal;
        if (index + 1 < self.sortedBreakpointEntries.count) {
            NSString *nextBreakpointKey = [self.sortedBreakpointEntries objectAtIndex:index + 1];
            NSNumber *maxValNum = [self.breakpoints objectForKey:nextBreakpointKey];
            maxVal = maxValNum.floatValue;
        } else {
            maxVal = CGFLOAT_MAX;
        }

        if (screenWidth >= minVal && screenWidth < maxVal) {
            currentBreakpointKey = breakpointKey;
            break;
        }
    }

    return currentBreakpointKey;
}

void registerUnistylesMethods(jsi::Runtime &runtime, UnistylesModule* weakSelf) {
    auto registerBreakpoints = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "registerBreakpoints"),
        1,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (arguments[0].isObject()) {
                jsi::Object breakpointsObj = arguments[0].asObject(runtime);
                NSDictionary *breakpointsDict = JSIObjectToNSDictionary(runtime, breakpointsObj);
                [weakSelf setBreakpoints:breakpointsDict];

                NSArray *sortedBreakpointEntries = [weakSelf.breakpoints keysSortedByValueUsingComparator:^NSComparisonResult(id obj1, id obj2) {
                    NSNumber *num1 = (NSNumber *)obj1;
                    NSNumber *num2 = (NSNumber *)obj2;
                    return [num1 compare:num2];
                }];
                [weakSelf setSortedBreakpointEntries:sortedBreakpointEntries];
            }

            return jsi::Value::undefined();
        }
    );

    auto getBreakpointPairs = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "getBreakpointPairs"),
        0,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            NSArray* breakpointPairs = [weakSelf sortedBreakpointEntries];
                    
            jsi::Array jsArray = jsi::Array(runtime, breakpointPairs.count);
            
            for (NSUInteger i = 0; i < breakpointPairs.count; i++) {
                NSArray *pair = [breakpointPairs objectAtIndex:i];
                NSString *key = pair[0];
                NSNumber *value = pair[1];
                
                jsi::Array jsPair = jsi::Array(runtime, 2);
                jsPair.setValueAtIndex(runtime, 0, jsi::String::createFromUtf8(runtime, key.UTF8String));
                jsPair.setValueAtIndex(runtime, 1, jsi::Value(value.doubleValue));
                
                jsArray.setValueAtIndex(runtime, i, jsPair);
            }
            
            return jsArray;
        }
    );

    auto getCurrentBreakpoint = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "getCurrentBreakpoint"),
        0,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (weakSelf.breakpoints.count == 0) {
                return jsi::Value::undefined();
            }

            CGFloat screenWidth = [UIScreen mainScreen].bounds.size.width;

            NSString *currentBreakpointKey = [weakSelf getCurrentBreakpoint:screenWidth];

            if (currentBreakpointKey) {
                return jsi::String::createFromUtf8(runtime, currentBreakpointKey.UTF8String);
            } else {
                return jsi::Value::undefined();
            }
        }
    );

    auto registerThemes = jsi::Function::createFromHostFunction(runtime,
        jsi::PropNameID::forAscii(runtime, "registerThemes"),
        1,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            std::string themeName = arguments[0].asString(runtime).utf8(runtime);
            NSString *themeNameNS = [NSString stringWithUTF8String:themeName.c_str()];

            [weakSelf.themes addObject:themeNameNS];

            return jsi::Value::undefined();
        }
    );

    auto useTheme = jsi::Function::createFromHostFunction(runtime,
        jsi::PropNameID::forAscii(runtime, "useTheme"),
        1,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (count > 0 && arguments[0].isString()) {
                std::string themeName = arguments[0].asString(runtime).utf8(runtime);
                NSString *themeNameNS = [NSString stringWithUTF8String:themeName.c_str()];

                weakSelf.currentTheme = themeNameNS;

                NSDictionary *body = @{
                    @"type": @"theme",
                    @"payload": @{
                        @"currentTheme": themeNameNS
                    }
                };
                [weakSelf emitEvent:@"onChange" withBody:body];
            }

            return jsi::Value::undefined();
        }
    );

    auto getCurrentTheme = jsi::Function::createFromHostFunction(runtime,
        jsi::PropNameID::forAscii(runtime, "getCurrentTheme"),
        0,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (weakSelf.currentTheme) {
                return jsi::String::createFromUtf8(runtime, weakSelf.currentTheme.UTF8String);
            }

            return jsi::Value::undefined();
        }
    );

    jsi::Object unistyles(runtime);
    unistyles.setProperty(runtime, "registerThemes", registerThemes);
    unistyles.setProperty(runtime, "useTheme", useTheme);
    unistyles.setProperty(runtime, "registerBreakpoints", registerBreakpoints);
    unistyles.setProperty(runtime, "getBreakpointPairs", getBreakpointPairs);
    unistyles.setProperty(runtime, "getCurrentBreakpoint", getCurrentBreakpoint);
    unistyles.setProperty(runtime, "getCurrentTheme", getCurrentTheme);

    runtime.global().setProperty(runtime, "__UNISTYLES__", unistyles);
}

void jsiConsoleLog(jsi::Runtime &runtime, const std::string &message) {
    jsi::Value console = runtime.global().getProperty(runtime, "console");
    auto logFunc = console.asObject(runtime).getPropertyAsFunction(runtime, "log");

    logFunc.call(runtime, jsi::String::createFromUtf8(runtime, message));
}

NSDictionary* JSIObjectToNSDictionary(jsi::Runtime &runtime, const jsi::Object &object) {
    NSMutableDictionary *resultDict = [NSMutableDictionary dictionary];

    jsi::Array propertyNames = object.getPropertyNames(runtime);
    for (size_t i = 0; i < propertyNames.size(runtime); i++) {
        jsi::String keyJSI = propertyNames.getValueAtIndex(runtime, i).asString(runtime);
        std::string keyStdString = keyJSI.utf8(runtime);
        NSString *key = [NSString stringWithUTF8String:keyStdString.c_str()];

        jsi::Value valueJSI = object.getProperty(runtime, keyJSI);
        if (valueJSI.isNumber()) {
            NSNumber *value = [NSNumber numberWithDouble:valueJSI.asNumber()];
            [resultDict setObject:value forKey:key];
        }
    }

    return resultDict;
}

@end
