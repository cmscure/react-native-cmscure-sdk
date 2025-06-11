// In cmscure-sdk-native-module/ios/CMSCureSDKModule.swift

import Foundation

@objc(CMSCureSDKModule)
class CMSCureSDKModule: RCTEventEmitter {

    override init() {
        super.init()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleContentUpdated(notification:)),
            name: .translationsUpdated,
            object: nil
        )
    }

    private static let CONTENT_UPDATED_EVENT = "onContentUpdated"

    // --- THIS FUNCTION IS NOW CORRECTED ---
    @objc(handleContentUpdated:)
    private func handleContentUpdated(notification: Notification) {
        guard let screenName = notification.userInfo?["screenName"] as? String else {
            sendEvent(withName: CMSCureSDKModule.CONTENT_UPDATED_EVENT, body: "__ALL__")
            return
        }

        var eventIdentifier = screenName

        // Map internal names to public event names, just like Android
        if screenName == "__colors__" {
            eventIdentifier = "__COLORS_UPDATED__"
        } else if screenName == "__images__" {
            eventIdentifier = "__IMAGES_UPDATED__"
        }
        
        print("[CMSCureSDKModule] Firing event onContentUpdated with identifier: \(eventIdentifier)")
        sendEvent(withName: CMSCureSDKModule.CONTENT_UPDATED_EVENT, body: eventIdentifier)
    }
    // --- END OF FIX ---

    override func supportedEvents() -> [String]! {
        return [CMSCureSDKModule.CONTENT_UPDATED_EVENT]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
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
}