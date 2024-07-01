#import "UnistylesModule.h"
#import "StyleSheet.h"
#import "UnistylesRuntime.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTScheduler.h>
#import <React/RCTShadowView.h>
#import <React/RCTComponentData.h>
#import <yoga/Yoga.h>
#include <yoga/YGValue.h>
#import <jsi/jsi.h>
#import <React/RCTTextShadowView.h>

#import "RCTUIManager.h"
#import "RCTUIManagerUtils.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "UIView+React.h"

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
    RCTUIManager *uiManager = [weakSelf.bridge uiManager];
    auto unistylesRuntime = std::make_shared<UnistylesRuntime>(*runtime, callInvoker);
    auto styleSheet = std::make_shared<StyleSheet>();

    [weakSelf.platform makeShared:unistylesRuntime.get()];

    auto unistylesHostObject = jsi::Object::createFromHostObject(*runtime, unistylesRuntime);
    auto styleSheetHostObject = jsi::Object::createFromHostObject(*runtime, styleSheet);

    styleSheet.get()->setOnViewUpdate([=](int nativeTag){
        dispatch_async(dispatch_get_main_queue(), ^{
            auto *view = [uiManager viewForReactTag:@(nativeTag)];
            __block RCTShadowView *shadowView = nullptr;

            dispatch_sync(RCTGetUIManagerQueue(), ^{
                shadowView = [uiManager shadowViewForReactTag:@(nativeTag)];
            });
            
 
            if ([shadowView isKindOfClass:[RCTTextShadowView class]]) {
                RCTTextShadowView* textShadowView = reinterpret_cast<RCTTextShadowView*>(shadowView);
                auto margin = YGValue{5, YGUnitPoint};
                [textShadowView setMarginLeft:margin];
                
                [view setBackgroundColor:[UIColor greenColor]];
                [view layoutIfNeeded];
                
                return;
            }
            
            if ([shadowView isKindOfClass:[RCTShadowView class]]) {
                [shadowView setFlex:1];
                [shadowView setJustifyContent:YGJustify::YGJustifyCenter];
                [shadowView setAlignItems:YGAlign::YGAlignCenter];
                
                [view setBackgroundColor:[UIColor systemPinkColor]];
                
                [view layoutIfNeeded];
                
                return;
            }
            
        
                    

//            NSDictionary *newProps = @{
//                @"flex": @(1),
//                @"backgroundColor": @"#cacaca",
////                @"justifyContent": @"center",
////                @"alignItems": @"center"
//            };
            

//            [uiManager synchronouslyUpdateViewOnUIThread:@(nativeTag) viewName:shadowView.viewName props:props];
    
//            [shadowView setFlex:1];
//            [shadowView setJustifyContent:YGJustify::YGJustifyCenter];
//            [shadowView setAlignItems:YGAlign::YGAlignCenter];
////            YGNodeMarkDirty(shadowView.yogaNode);
//            [uiManager setNeedsLayout];
//        
//            [view setBackgroundColor:[UIColor systemPinkColor]];
//            [view layoutIfNeeded];
//            [shadowView didSetProps:@[@"flex", @"justifyContent", @"alignItems"]];
//            [view didSetProps:@[@"backgroundColor"]];
//            [uiManager setNeedsLayout];
//            [view didSetProps:@[@("backgroundColor"), @("flex")]];

//            dispatch_async(RCTGetUIManagerQueue(), ^{
//                auto viewName = [uiManager viewNameForReactTag:@(nativeTag)];
//
//                [uiManager synchronouslyUpdateViewOnUIThread:@(nativeTag) viewName:viewName props:props];
//            });
        });
    });

    runtime->global().setProperty(*runtime, "__UNISTYLES__", std::move(unistylesHostObject));
    runtime->global().setProperty(*runtime, "__UNISTYLES__STYLESHEET__", std::move(styleSheetHostObject));
}

@end

#pragma mark - End
