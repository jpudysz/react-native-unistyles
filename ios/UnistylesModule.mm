#import "UnistylesModule.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <jsi/jsi.h>

@implementation UnistylesModule

using namespace facebook;

RCT_EXPORT_MODULE(Unistyles)

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

void registerUnistylesMethods(jsi::Runtime &runtime, UnistylesModule* weakSelf) {
    auto addBreakpoints = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "addBreakpoints"),
        1,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            if (arguments[0].isObject()) {
                jsi::Object breakpointsObj = arguments[0].asObject(runtime);
                NSDictionary *breakpointsDict = JSIObjectToNSDictionary(runtime, breakpointsObj);
                [weakSelf setBreakpoints:breakpointsDict];

                NSArray *sortedBreakpointEntries = [[weakSelf.breakpoints allKeys] sortedArrayUsingSelector:@selector(compare:)];
                [weakSelf setSortedBreakpointEntries:sortedBreakpointEntries];
            }

            return jsi::Value::undefined();
        }
    );

    auto getBreakpoints = jsi::Function::createFromHostFunction(
        runtime,
        jsi::PropNameID::forAscii(runtime, "getBreakpoints"),
        0,
        [weakSelf](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            NSDictionary* breakpointsDict = [weakSelf breakpoints];
            jsi::Object resultObj = NSDictionaryToJSIObject(runtime, breakpointsDict);

            return resultObj;
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

            NSString *currentBreakpointKey = nil;

            for (NSInteger index = 0; index < weakSelf.sortedBreakpointEntries.count; index++) {
                NSString *breakpointKey = [weakSelf.sortedBreakpointEntries objectAtIndex:index];
                NSNumber *minValNum = [weakSelf.breakpoints objectForKey:breakpointKey];
                CGFloat minVal = minValNum.floatValue;

                CGFloat maxVal;
                if (index + 1 < weakSelf.sortedBreakpointEntries.count) {
                    NSString *nextBreakpointKey = [weakSelf.sortedBreakpointEntries objectAtIndex:index + 1];
                    NSNumber *maxValNum = [weakSelf.breakpoints objectForKey:nextBreakpointKey];
                    maxVal = maxValNum.floatValue;
                } else {
                    maxVal = CGFLOAT_MAX;
                }

                if (screenWidth >= minVal && screenWidth < maxVal) {
                    currentBreakpointKey = breakpointKey;
                    break;
                }
            }

            if (currentBreakpointKey) {
                return jsi::String::createFromUtf8(runtime, currentBreakpointKey.UTF8String);
            } else {
                return jsi::Value::undefined();
            }
        }
    );

    auto addTheme = jsi::Function::createFromHostFunction(runtime,
        jsi::PropNameID::forAscii(runtime, "addTheme"),
        2,
        [](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *arguments, size_t count) -> jsi::Value {
            std::string themeName = arguments[0].asString(runtime).utf8(runtime);
            jsiConsoleLog(runtime, "Theme name: " + themeName);

            return jsi::Value::undefined();
        }
    );

    jsi::Object unistyles(runtime);
    unistyles.setProperty(runtime, "addTheme", addTheme);
    unistyles.setProperty(runtime, "addBreakpoints", addBreakpoints);
    unistyles.setProperty(runtime, "getBreakpoints", getBreakpoints);
    unistyles.setProperty(runtime, "getCurrentBreakpoint", getCurrentBreakpoint);

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

jsi::Object NSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *dict) {
    jsi::Object resultObj(runtime);

    for (NSString* key in dict) {
        NSNumber* value = [dict objectForKey:key];
        if ([value isKindOfClass:[NSNumber class]]) {
            resultObj.setProperty(runtime, key.UTF8String, jsi::Value(value.doubleValue));
        }
    }

    return resultObj;
}

@end
