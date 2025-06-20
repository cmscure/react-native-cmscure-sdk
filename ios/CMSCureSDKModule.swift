import Foundation
import CMSCureSDK // Assuming your native SDK is available as a module

@objc(CMSCureSDKModule)
class CMSCureSDKModule: RCTEventEmitter {

    override init() {
        super.init()
        // Listen for the unified notification from the native SDK
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleContentUpdated(notification:)),
            name: .translationsUpdated, // This is the single notification now
            object: nil
        )
    }

    private static let CONTENT_UPDATED_EVENT = "onContentUpdated"

    @objc(handleContentUpdated:)
    private func handleContentUpdated(notification: Notification) {
        // The native SDK now sends a single notification type.
        // We can inspect the userInfo to see what changed.
        guard let userInfo = notification.userInfo,
              let identifier = userInfo["screenName"] as? String else {
            // If no specific identifier, assume a full sync
            sendEvent(withName: CMSCureSDKModule.CONTENT_UPDATED_EVENT, body: ["type": "fullSync"])
            return
        }

        var eventPayload: [String: Any] = ["identifier": identifier]

        if identifier == "__colors__" {
            eventPayload["type"] = "colors"
        } else if identifier == "__images__" {
            eventPayload["type"] = "images"
        } else if Cure.shared.getStoreItems(for: identifier).count > 0 || identifier.contains("store") { // Heuristic
            eventPayload["type"] = "dataStore"
        } else {
            eventPayload["type"] = "translations"
        }
        
        sendEvent(withName: CMSCureSDKModule.CONTENT_UPDATED_EVENT, body: eventPayload)
    }

    override func supportedEvents() -> [String]! {
        return [CMSCureSDKModule.CONTENT_UPDATED_EVENT]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return false // Configuration can happen in the background
    }

    @objc(configure:apiKey:projectSecret:resolver:rejecter:)
    func configure(projectId: String, apiKey: String, projectSecret: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        print("[CMSCureSDKModule] Configuring with Project ID: \(projectId)")
        Cure.shared.configure(projectId: projectId, apiKey: apiKey, projectSecret: projectSecret)
        Cure.shared.startListening()
        resolve("Configuration initiated.")
    }

    @objc(setLanguage:resolver:rejecter:)
    func setLanguage(languageCode: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        print("[CMSCureSDKModule] Setting language to: \(languageCode)")
        Cure.shared.setLanguage(languageCode) {
            print("[CMSCureSDKModule] Set language completion for \(languageCode).")
            resolve("Language set to \(languageCode).")
        }
    }

    // ... The rest of the methods are unchanged ...
    @objc(getLanguage:rejecter:)
    func getLanguage(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let lang = Cure.shared.getLanguage()
        print("[CMSCureSDKModule] getLanguage returning: '\(lang)'")
        resolve(lang)
    }

    @objc(availableLanguages:rejecter:)
    func availableLanguages(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        Cure.shared.availableLanguages { languages in
            print("[CMSCureSDKModule] availableLanguages returning: \(languages)")
            resolve(languages)
        }
    }

    @objc(translation:inTab:resolver:rejecter:)
    func translation(for key: String, inTab tab: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let value = Cure.shared.translation(for: key, inTab: tab)
        resolve(value)
    }

    @objc(colorValue:resolver:rejecter:)
    func colorValue(for key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let value = Cure.shared.colorValue(for: key)
        resolve(value)
    }

    @objc(imageUrl:inTab:resolver:rejecter:)
    func imageUrl(for key: String, inTab tab: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let url = Cure.shared.imageUrl(for: key, inTab: tab)?.absoluteString
        resolve(url)
    }

    @objc(imageURL:resolver:rejecter:)
    func imageURL(forKey key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let url = Cure.shared.imageURL(forKey: key)?.absoluteString
        resolve(url)
    }

    @objc(sync:resolver:rejecter:)
    func sync(screenName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        Cure.shared.sync(screenName: screenName) { success in
            if success {
                resolve(true)
            } else {
                let error = NSError(domain: "CMSCureSDK", code: 1, userInfo: [NSLocalizedDescriptionKey: "Sync failed for screen: \(screenName)"])
                reject("sync_failed", "Sync failed for screen: \(screenName)", error)
            }
        }
    }

    @objc(getStoreItems:resolver:rejecter:)
    func getStoreItems(apiIdentifier: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let items = Cure.shared.getStoreItems(for: apiIdentifier).map { $0.toDictionary() }
        resolve(items)
    }

    @objc(syncStore:resolver:rejecter:)
    func syncStore(apiIdentifier: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        Cure.shared.syncStore(apiIdentifier: apiIdentifier) { success in
            resolve(success)
        }
    }    
}

// Add a helper to convert DataStoreItem to a Dictionary for React Native
extension DataStoreItem {
    func toDictionary() -> [String: Any] {
        return [
            "id": self.id,
            "data": self.data.mapValues { $0.toDictionary() },
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
        ]
    }
}

extension JSONValue {
    func toDictionary() -> [String: Any?] {
        var dict: [String: Any?] = [:]
        dict["stringValue"] = self.stringValue
        dict["intValue"] = self.intValue
        dict["doubleValue"] = self.doubleValue
        dict["boolValue"] = self.boolValue
        dict["localizedString"] = self.localizedString
        return dict
    }
}