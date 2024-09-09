#pragma once

#import <React/RCTEventEmitter.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import "TurboUnistyles/TurboUnistyles.h"

@interface UnistylesModule: RCTEventEmitter<NativeTurboUnistylesSpec>
@end

@interface UnistylesModule()<RCTTurboModuleWithJSIBindings>
@end
