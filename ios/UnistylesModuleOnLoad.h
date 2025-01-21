#pragma once

#ifndef RCT_NEW_ARCH_ENABLED
    #error "Unistyles 3.0 requires your project to have New Architecture enabled."
#endif

#import <React/RCTEventEmitter.h>
#import "TurboUnistyles/TurboUnistyles.h"
#import <React/RCTSurfacePresenter.h>
#import <React/RCTScheduler.h>
#import <React/RCTCallInvoker.h>
#import <React/RCTCallInvokerModule.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>

@interface UnistylesModule: RCTEventEmitter<NativeTurboUnistylesSpec, RCTCallInvokerModule>
@end

@interface UnistylesModule()<RCTTurboModuleWithJSIBindings>
@end
