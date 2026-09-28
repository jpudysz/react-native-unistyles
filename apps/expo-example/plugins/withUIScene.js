// Apps built with the iOS 27 SDK fail to launch without the UIScene life cycle
// ("UIScene life cycle is required for apps built with this SDK").
// Expo SDK 57 template still creates the window in AppDelegate, so move it to a SceneDelegate.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins')

const WINDOW_SETUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`

const SCENE_CONFIGURATION = `
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self

    return configuration
  }
`

const SCENE_DELEGATE = `
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      return
    }

    let window = UIWindow(windowScene: windowScene)

    self.window = window
    appDelegate.window = window

    factory.startReactNative(withModuleName: "main", in: window, launchOptions: nil)
  }
}
`

const withUISceneAppDelegate = config =>
    withAppDelegate(config, config => {
        let contents = config.modResults.contents

        if (contents.includes('class SceneDelegate')) {
            return config
        }

        if (config.modResults.language !== 'swift' || !contents.includes(WINDOW_SETUP)) {
            throw new Error('withUIScene: unexpected AppDelegate template, update plugins/withUIScene.js')
        }

        contents = contents.replace(WINDOW_SETUP, '')
        contents = contents.replace(
            /(\n  \/\/ Linking API\n)/,
            `${SCENE_CONFIGURATION}$1`,
        )
        contents = contents.replace(/\nclass ReactNativeDelegate/, `${SCENE_DELEGATE}\nclass ReactNativeDelegate`)
        config.modResults.contents = contents

        return config
    })

const withUISceneInfoPlist = config =>
    withInfoPlist(config, config => {
        config.modResults.UIApplicationSceneManifest = {
            UIApplicationSupportsMultipleScenes: false,
        }

        return config
    })

module.exports = config => withUISceneInfoPlist(withUISceneAppDelegate(config))
