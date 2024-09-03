#pragma once

#import <React/RCTBridgeModule.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTEventEmitter.h>
#import "TurboUnistyles/TurboUnistyles.h"

@interface RCTBridge (BridgeWithRuntime)

- (void *)runtime;

@end

@interface UnistylesModule: RCTEventEmitter<RCTBridgeModule, NativeTurboUnistylesSpec>
@end
