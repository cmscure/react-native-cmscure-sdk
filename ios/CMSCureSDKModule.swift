import Foundation
import React

@objc(CMSCureSDK) 
class CMSCureSDKModule: RCTEventEmitter {
    
    private var hasListeners = false
    private var contentUpdateObserver: NSObjectProtocol?
    
    override init() {
        super.init()
        setupContentUpdateListener()
    }
    
    deinit {
        if let observer = contentUpdateObserver {
            NotificationCenter.default.removeObserver(observer)
        }
    }
    
    // MARK: - RCTEventEmitter
    
    override func supportedEvents() -> [String]! {
        return ["CMSCureContentUpdate"]
    }
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Content Update Handling
    
    private func setupContentUpdateListener() {
        contentUpdateObserver = NotificationCenter.default.addObserver(
            forName: .translationsUpdated,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let self = self, self.hasListeners else { return }
            
            if let userInfo = notification.userInfo,
               let screenName = userInfo["screenName"] as? String {
                
                let updateType: String
                switch screenName {
                case CMSCureSDK.ALL_SCREENS_UPDATED:
                    updateType = "all"
                case CMSCureSDK.COLORS_UPDATED:
                    updateType = "colors"
                case CMSCureSDK.IMAGES_UPDATED:
                    updateType = "images"
                default:
                    // Check if it's a datastore
                    if screenName.contains("store") {
                        updateType = "dataStore"
                    } else {
                        updateType = "translation"
                    }
                }
                
                self.sendEvent(withName: "CMSCureContentUpdate", body: [
                    "type": updateType,
                    "identifier": screenName
                ])
            }
        }
    }
    
    // MARK: - Bridge Methods
    
    @objc func configure(_ projectId: String,
                        apiKey: String,
                        projectSecret: String,
                        resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock) {
        CMSCureSDK.shared.configure(
            projectId: projectId,
            apiKey: apiKey,
            projectSecret: projectSecret
        )
        resolver(true)
    }
    
    @objc func setLanguage(_ languageCode: String,
                          resolver: @escaping RCTPromiseResolveBlock,
                          rejecter: @escaping RCTPromiseRejectBlock) {
        CMSCureSDK.shared.setLanguage(languageCode) {
            resolver(true)
        }
    }
    
    @objc func getLanguage(_ resolver: @escaping RCTPromiseResolveBlock,
                          rejecter: @escaping RCTPromiseRejectBlock) {
        let language = CMSCureSDK.shared.getLanguage()
        resolver(language)
    }
    
    @objc func availableLanguages(_ resolver: @escaping RCTPromiseResolveBlock,
                                 rejecter: @escaping RCTPromiseRejectBlock) {
        CMSCureSDK.shared.availableLanguages { languages in
            resolver(languages)
        }
    }
    
    @objc func translation(_ key: String,
                          tab: String,
                          resolver: @escaping RCTPromiseResolveBlock,
                          rejecter: @escaping RCTPromiseRejectBlock) {
        let value = CMSCureSDK.shared.translation(for: key, inTab: tab)
        resolver(value.isEmpty ? nil : value)
    }
    
    @objc func colorValue(_ key: String,
                         resolver: @escaping RCTPromiseResolveBlock,
                         rejecter: @escaping RCTPromiseRejectBlock) {
        let value = CMSCureSDK.shared.colorValue(for: key)
        resolver(value)
    }
    
    @objc func imageURL(_ key: String,
                       resolver: @escaping RCTPromiseResolveBlock,
                       rejecter: @escaping RCTPromiseRejectBlock) {
        let url = CMSCureSDK.shared.imageURL(forKey: key)
        resolver(url?.absoluteString)
    }
    
    @objc func getStoreItems(_ apiIdentifier: String,
                            resolver: @escaping RCTPromiseResolveBlock,
                            rejecter: @escaping RCTPromiseRejectBlock) {
        let items = CMSCureSDK.shared.getStoreItems(for: apiIdentifier)
        let mappedItems = items.map { item -> [String: Any] in
            var result: [String: Any] = [
                "id": item.id,
                "createdAt": item.createdAt,
                "updatedAt": item.updatedAt,
                "is_active": item.data["is_active"]?.boolValue ?? true
            ]
            
            // Map the data
            var dataMap: [String: Any] = [:]
            for (key, value) in item.data {
                var valueMap: [String: Any] = [:]
                
                switch value {
                case .string(let str):
                    valueMap["stringValue"] = str
                    valueMap["localizedString"] = str
                    
                case .int(let num):
                    valueMap["intValue"] = num
                    valueMap["stringValue"] = String(num)
                    valueMap["localizedString"] = String(num)
                    
                case .double(let num):
                    valueMap["doubleValue"] = num
                    valueMap["stringValue"] = String(num)
                    valueMap["localizedString"] = String(num)
                    
                case .bool(let bool):
                    valueMap["boolValue"] = bool
                    valueMap["stringValue"] = String(bool)
                    valueMap["localizedString"] = String(bool)
                    
                case .localizedObject(let dict):
                    let localizedValue = dict[CMSCureSDK.shared.getLanguage()] ?? dict["en"] ?? dict.values.first ?? ""
                    valueMap["localizedString"] = localizedValue
                    valueMap["stringValue"] = localizedValue
                    valueMap["values"] = dict
                    
                case .null:
                    valueMap["stringValue"] = NSNull()
                    valueMap["localizedString"] = NSNull()
                }
                
                dataMap[key] = valueMap
            }
            
            result["data"] = dataMap
            return result
        }
        
        resolver(mappedItems)
    }
    
    @objc func syncStore(_ apiIdentifier: String,
                        resolver: @escaping RCTPromiseResolveBlock,
                        rejecter: @escaping RCTPromiseRejectBlock) {
        CMSCureSDK.shared.syncStore(apiIdentifier: apiIdentifier) { success in
            resolver(success)
        }
    }
    
    @objc func sync(_ screenName: String,
                   resolver: @escaping RCTPromiseResolveBlock,
                   rejecter: @escaping RCTPromiseRejectBlock) {
        CMSCureSDK.shared.sync(screenName: screenName) { success in
            resolver(success)
        }
    }
}

// MARK: - Constants Extension
extension CMSCureSDK {
    static let ALL_SCREENS_UPDATED = "__ALL_SCREENS_UPDATED__"
    static let COLORS_UPDATED = "__colors__"
    static let IMAGES_UPDATED = "__images__"
}