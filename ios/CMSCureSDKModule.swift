import React // <--- ADDED THIS IMPORT
import Foundation
// Import your existing CMSCureSDK for iOS.
// Make sure CMSCureSDK.swift is included in the same target as this file,
// or that it's part of a framework that this module depends on.
// For this example, we assume CMSCureSDK.swift is in the same directory
// and will be compiled as part of this module.

@objc(CMSCureSDK)
class CMSCureSDKModule: RCTEventEmitter {

  // Shared instance of your native SDK
  private let cureSDK = Cure.shared
  private var hasListeners = false // To manage sending events

  // Required for RCTEventEmitter
  override static func moduleName() -> String! {
    return "CMSCureSDK"
  }

  // Required for RCTEventEmitter.
  override static func requiresMainQueueSetup() -> Bool {
    return true // Native configure and event setup might interact with main thread.
  }

  // --- Event Emitter Methods ---

  override func supportedEvents() -> [String]! {
    return ["CMSCureContentUpdated"] // Name of the event to be sent to JS
  }

  override func startObserving() {
    hasListeners = true
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(handleContentUpdate(_:)),
                                           name: .translationsUpdated,
                                           object: nil)
  }

  override func stopObserving() {
    hasListeners = false
    NotificationCenter.default.removeObserver(self, name: .translationsUpdated, object: nil)
  }

  @objc private func handleContentUpdate(_ notification: Notification) {
    if hasListeners {
      var eventBody: [String: Any] = [:]
      if let userInfo = notification.userInfo, let screenName = userInfo["screenName"] as? String {
        // Assuming your Cure.shared has constants like these or similar logic for event types
        // These are illustrative; replace with your actual constants/logic from CMSCureSDK.swift
        let colorsUpdatedInternalName = "__colors__" // Example
        let allScreensUpdatedInternalName = "__ALL_SCREENS_UPDATED__" // Example

        if screenName == colorsUpdatedInternalName {
             eventBody["type"] = "COLORS_UPDATED"
        } else if screenName == allScreensUpdatedInternalName {
             eventBody["type"] = "ALL_SCREENS_UPDATED"
        } else {
             eventBody["type"] = "SCREEN_UPDATED"
             eventBody["screenName"] = screenName
        }
      } else {
        // Default or general update if no specific screenName is provided
        eventBody["type"] = "ALL_SCREENS_UPDATED"
      }
      sendEvent(withName: "CMSCureContentUpdated", body: eventBody)
    }
  }


  // --- Bridged Methods ---

  @objc(startListening:rejecter:)
  func startListening(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      Cure.shared.startListening()
      resolve(nil)
    }
  }

  @objc(configure:resolver:rejecter:)
  func configure(options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let projectId = options["projectId"] as? String,
          let apiKey = options["apiKey"] as? String,
          let projectSecret = options["projectSecret"] as? String else {
      let error = NSError(domain: "CMSCureSDKError", code: 100, userInfo: [NSLocalizedDescriptionKey: "Missing required configuration options (projectId, apiKey, projectSecret)."])
      reject("CONFIG_ERROR", "Missing required options", error)
      return
    }

    let serverUrlString = options["serverUrl"] as? String
    let socketIOUrlString = options["socketIOUrl"] as? String

    // Call configure on the main thread if it's not inherently thread-safe or interacts with UI components
    DispatchQueue.main.async {
        self.cureSDK.configure(
            projectId: projectId,
            apiKey: apiKey,
            projectSecret: projectSecret
        )
        // Assuming configure is synchronous and does not throw/callback errors for this bridge
        resolve(nil)
    }
  }

  @objc(setLanguage:force:resolver:rejecter:)
  func setLanguage(languageCode: String, force: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    cureSDK.setLanguage(languageCode, force: force) {
        resolve(nil)
    }
  }

  @objc(getLanguage:rejecter:)
  func getLanguage(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let lang = cureSDK.getLanguage()
    resolve(lang)
  }

  @objc(getAvailableLanguages:rejecter:)
  func getAvailableLanguages(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    cureSDK.availableLanguages { languagesArray in
      resolve(languagesArray)
    }
  }

  @objc(translation:inTab:resolver:rejecter:)
  func translation(key: String, tab: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let trans = cureSDK.translation(for: key, inTab: tab)
    resolve(trans)
  }

  @objc(colorValue:resolver:rejecter:)
  func colorValue(key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let color = cureSDK.colorValue(for: key)
    resolve(color)
  }

  @objc(imageUrl:inTab:resolver:rejecter:)
  func imageUrl(key: String, tab: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let url = cureSDK.imageUrl(for: key, inTab: tab)
    resolve(url?.absoluteString)
  }

  @objc(sync:resolver:rejecter:)
  func sync(screenName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    cureSDK.sync(screenName: screenName) { success in
      if success {
        resolve(nil)
      } else {
        let error = NSError(domain: "CMSCureSDKError", code: 200, userInfo: [NSLocalizedDescriptionKey: "Sync failed for screen: \(screenName)"])
        reject("SYNC_ERROR", "Sync operation failed for screen: \(screenName)", error)
      }
    }
  }

  @objc(isConnected:rejecter:)
  func isConnected(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let connected = cureSDK.isConnected()
    resolve(connected)
  }

  @objc(setDebugLogsEnabled:resolver:rejecter:)
  func setDebugLogsEnabled(enabled: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    cureSDK.debugLogsEnabled = enabled
    resolve(nil)
  }

  @objc(clearCache:rejecter:)
  func clearCache(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    cureSDK.clearCache()
    resolve(nil)
  }

  @objc(getKnownTabs:rejecter:)
  func getKnownTabs(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    // Assuming 'cureSDK' is your instance of CMSCureSDK.shared
    let tabsArray = cureSDK.getKnownProjectTabsArray()
    resolve(tabsArray)
  }
}
