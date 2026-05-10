import ExpoModulesCore
import UIKit

private final class AlternateIconsUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "Alternate app icons are not available for this app."
  }
}

private final class UnknownIconException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Unknown app icon '\(param)'. Make sure it is declared in the react-native-awesome-app-icon config plugin."
  }
}

public class AwesomeAppIconModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AwesomeAppIcon")

    Function("supportsAlternateIcons") {
#if os(iOS) || os(tvOS)
      return UIApplication.shared.supportsAlternateIcons
#else
      return false
#endif
    }

    Function("getAvailableIcons") {
      return self.availableIconNames()
    }

    Function("getAppIcon") {
#if os(iOS) || os(tvOS)
      guard let nativeName = UIApplication.shared.alternateIconName else {
        return nil as String?
      }
      return self.iconName(forNativeName: nativeName)
#else
      return nil as String?
#endif
    }

    AsyncFunction("setAppIconAsync") { (iconName: String?, promise: Promise) in
#if os(iOS) || os(tvOS)
      guard UIApplication.shared.supportsAlternateIcons else {
        promise.reject(AlternateIconsUnavailableException())
        return
      }

      let nativeName: String?
      if let iconName {
        guard let mappedName = self.nativeIconName(forIconName: iconName) else {
          promise.reject(UnknownIconException(iconName))
          return
        }
        nativeName = mappedName
      } else {
        nativeName = nil
      }

      UIApplication.shared.setAlternateIconName(nativeName) { error in
        if let error {
          promise.reject(error)
          return
        }
        promise.resolve(nil)
      }
#else
      promise.reject(AlternateIconsUnavailableException())
#endif
    }.runOnQueue(.main)
  }

  private func availableIconNames() -> [String] {
    return Bundle.main.object(forInfoDictionaryKey: "AwesomeAppIconIconNames") as? [String] ?? []
  }

  private func iconMap() -> [String: String] {
    return Bundle.main.object(forInfoDictionaryKey: "AwesomeAppIconIconMap") as? [String: String] ?? [:]
  }

  private func nativeIconName(forIconName iconName: String) -> String? {
    return iconMap()[iconName]
  }

  private func iconName(forNativeName nativeName: String) -> String? {
    return iconMap().first { $0.value == nativeName }?.key
  }
}
