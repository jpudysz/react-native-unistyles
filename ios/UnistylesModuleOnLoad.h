#pragma once

#import <React/RCTSurfacePresenter.h>
#import <React/RCTEventEmitter.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import "TurboUnistyles/TurboUnistyles.h"
#import "Converter.h"

@interface UnistylesModule: RCTEventEmitter<NativeTurboUnistylesSpec>
@end

@interface UnistylesModule()<RCTTurboModuleWithJSIBindings>
@end
