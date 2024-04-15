import SwiftUI
import React
import React_RCTSwiftExtensions

@main
struct visionApp: App {
  @UIApplicationDelegateAdaptor var delegate: AppDelegate
  
  var body: some Scene {
    RCTMainWindow(moduleName: "vision")
  }
}
