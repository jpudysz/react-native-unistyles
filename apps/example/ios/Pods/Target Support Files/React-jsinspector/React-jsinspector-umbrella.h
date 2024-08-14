#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "jsinspector-modern/CdpJson.h"
#import "jsinspector-modern/ConsoleMessage.h"
#import "jsinspector-modern/ExecutionContext.h"
#import "jsinspector-modern/ExecutionContextManager.h"
#import "jsinspector-modern/FallbackRuntimeAgentDelegate.h"
#import "jsinspector-modern/FallbackRuntimeTargetDelegate.h"
#import "jsinspector-modern/ForwardingConsoleMethods.def"
#import "jsinspector-modern/HostAgent.h"
#import "jsinspector-modern/HostCommand.h"
#import "jsinspector-modern/HostTarget.h"
#import "jsinspector-modern/InspectorFlags.h"
#import "jsinspector-modern/InspectorInterfaces.h"
#import "jsinspector-modern/InspectorPackagerConnection.h"
#import "jsinspector-modern/InspectorPackagerConnectionImpl.h"
#import "jsinspector-modern/InspectorUtilities.h"
#import "jsinspector-modern/InstanceAgent.h"
#import "jsinspector-modern/InstanceTarget.h"
#import "jsinspector-modern/ReactCdp.h"
#import "jsinspector-modern/RuntimeAgent.h"
#import "jsinspector-modern/RuntimeAgentDelegate.h"
#import "jsinspector-modern/RuntimeTarget.h"
#import "jsinspector-modern/ScopedExecutor.h"
#import "jsinspector-modern/SessionState.h"
#import "jsinspector-modern/StackTrace.h"
#import "jsinspector-modern/UniqueMonostate.h"
#import "jsinspector-modern/WeakList.h"
#import "jsinspector-modern/WebSocketInterfaces.h"

FOUNDATION_EXPORT double jsinspector_modernVersionNumber;
FOUNDATION_EXPORT const unsigned char jsinspector_modernVersionString[];

