#pragma once

#ifndef RCT_NEW_ARCH_ENABLED
    #error "Unistyles 3.0 requires your project to have New Architecture enabled."
#endif

#if __has_include(<ReactCommon/RCTTurboModuleWithJSIBindings.h>)
    #import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#else
    #error "Unistyles 3.0 requires your project to use React Native 0.75 or higher."
#endif

#import <React/RCTEventEmitter.h>
#import "TurboUnistyles/TurboUnistyles.h"
#import <React/RCTSurfacePresenter.h>
#import <React/RCTScheduler.h>
#import <React/RCTRuntimeExecutorModule.h>
#import <ReactCommon/RCTRuntimeExecutor.h>

@interface UnistylesModule: RCTEventEmitter<NativeTurboUnistylesSpec>
@end

@interface UnistylesModule()<RCTTurboModuleWithJSIBindings, RCTRuntimeExecutorModule>
@end
