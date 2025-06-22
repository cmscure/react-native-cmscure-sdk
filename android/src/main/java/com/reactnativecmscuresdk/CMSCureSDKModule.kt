package com.reactnativecmscuresdk

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.reactnativecmscuresdk.CMSCureSDK
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collectLatest
import android.util.Log

class CMSCureSDKModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val scope = CoroutineScope(Dispatchers.Main)
    private val TAG = "CMSCureSDKModule"
    
    override fun getName() = "CMSCureSDK"
    
    override fun initialize() {
        super.initialize()
        // Initialize the SDK with context
        CMSCureSDK.init(reactContext.applicationContext)
        
        // Set up content update listener
        scope.launch {
            CMSCureSDK.contentUpdateFlow.collectLatest { identifier ->
                Log.d(TAG, "Content updated: $identifier")
                sendContentUpdateEvent(identifier)
            }
        }
    }
    
    private fun sendContentUpdateEvent(identifier: String) {
    val params = Arguments.createMap().apply {
        putString("identifier", identifier)
        when (identifier) {
            CMSCureSDK.ALL_SCREENS_UPDATED -> putString("type", "all")
            CMSCureSDK.COLORS_UPDATED -> putString("type", "colors")
            CMSCureSDK.IMAGES_UPDATED -> putString("type", "images")
            else -> {
                // Better detection for datastores
                if (identifier.contains("store")) {
                    putString("type", "dataStore")
                } else {
                    // Try to determine by content
                    try {
                        val items = CMSCureSDK.getStoreItems(identifier)
                        if (items.isNotEmpty()) {
                            putString("type", "dataStore")
                        } else {
                            putString("type", "translation")
                        }
                    } catch (e: Exception) {
                        putString("type", "translation")
                    }
                }
            }
        }
    }
    
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("CMSCureContentUpdate", params)
}
    
    @ReactMethod
    fun configure(projectId: String, apiKey: String, promise: Promise) {
        try {
            CMSCureSDK.configure(reactContext.applicationContext, projectId, apiKey)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONFIGURE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun setLanguage(languageCode: String, promise: Promise) {
        try {
            CMSCureSDK.setLanguage(languageCode)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_LANGUAGE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun getLanguage(promise: Promise) {
        try {
            val language = CMSCureSDK.getLanguage()
            promise.resolve(language)
        } catch (e: Exception) {
            promise.reject("GET_LANGUAGE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun availableLanguages(promise: Promise) {
        try {
            CMSCureSDK.availableLanguages { languages ->
                val array = Arguments.createArray()
                languages.forEach { array.pushString(it) }
                promise.resolve(array)
            }
        } catch (e: Exception) {
            // If there's an error, try to return cached languages
            val cachedLanguages = listOf("en", "ru", "fr") // Default fallback
            val array = Arguments.createArray()
            cachedLanguages.forEach { array.pushString(it) }
            promise.resolve(array)
        }
    }
    
    @ReactMethod
    fun translation(key: String, tab: String, promise: Promise) {
        try {
            val value = CMSCureSDK.translation(forKey = key, inTab = tab)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("TRANSLATION_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun colorValue(key: String, promise: Promise) {
        try {
            val value = CMSCureSDK.colorValue(forKey = key)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("COLOR_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun imageURL(key: String, promise: Promise) {
        try {
            val value = CMSCureSDK.imageURL(forKey = key)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("IMAGE_URL_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun getStoreItems(apiIdentifier: String, promise: Promise) {
        try {
            val items = CMSCureSDK.getStoreItems(forIdentifier = apiIdentifier)
            val activeItems = items.filter { item ->
                // Keep item if 'is_active' is not explicitly false. Defaults to true if key is missing.
                item.data["is_active"]?.boolValue != false
            }
            val array = Arguments.createArray()
            
            activeItems.forEach { item ->
                val map = Arguments.createMap().apply {
                    putString("id", item.id)
                    putString("createdAt", item.createdAt)
                    putString("updatedAt", item.updatedAt)
                    
                    // Put is_active at the root level
                    val isActive = item.data["is_active"]?.boolValue ?: true
                    putBoolean("is_active", isActive)
                    
                    // Create a proper data map with all fields
                    val dataMap = Arguments.createMap()
                    item.data.forEach { (key, value) ->
                        // For each field, create a sub-object with all value types
                        val valueMap = Arguments.createMap()
                        
                        when (value) {
                            is JSONValue.StringValue -> {
                                valueMap.putString("stringValue", value.value)
                                valueMap.putString("localizedString", value.value)
                                dataMap.putMap(key, valueMap)
                            }
                            is JSONValue.IntValue -> {
                                valueMap.putInt("intValue", value.value)
                                valueMap.putString("stringValue", value.value.toString())
                                valueMap.putString("localizedString", value.value.toString())
                                dataMap.putMap(key, valueMap)
                            }
                            is JSONValue.DoubleValue -> {
                                valueMap.putDouble("doubleValue", value.value)
                                valueMap.putString("stringValue", value.value.toString())
                                valueMap.putString("localizedString", value.value.toString())
                                dataMap.putMap(key, valueMap)
                            }
                            is JSONValue.BoolValue -> {
                                valueMap.putBoolean("boolValue", value.value)
                                valueMap.putString("stringValue", value.value.toString())
                                valueMap.putString("localizedString", value.value.toString())
                                dataMap.putMap(key, valueMap)
                            }
                            is JSONValue.LocalizedStringValue -> {
                                val localizedValue = value.localizedString
                                valueMap.putString("localizedString", localizedValue ?: "")
                                valueMap.putString("stringValue", localizedValue ?: "")
                                
                                // Also include the raw localized values
                                val localesMap = Arguments.createMap()
                                value.values.forEach { (lang, text) ->
                                    localesMap.putString(lang, text)
                                }
                                valueMap.putMap("values", localesMap)
                                
                                dataMap.putMap(key, valueMap)
                            }
                            is JSONValue.NullValue -> {
                                valueMap.putNull("stringValue")
                                valueMap.putNull("localizedString")
                                dataMap.putMap(key, valueMap)
                            }
                        }
                    }
                    putMap("data", dataMap)
                }
                array.pushMap(map)
            }
            
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("GET_STORE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun syncStore(apiIdentifier: String, promise: Promise) {
        // This now has a completion handler to wait for the async operation
        CMSCureSDK.syncStore(apiIdentifier) { success ->
            if (success) {
                // After a successful sync, immediately get the newly cached and filtered items
                // and resolve the promise with that data, just like iOS.
                this.getStoreItems(apiIdentifier, promise)
            } else {
                promise.reject("SYNC_STORE_FAILED", "Failed to sync data store on Android")
            }
        }
}
    
    @ReactMethod
    fun sync(screenName: String, promise: Promise) {
        CMSCureSDK.sync(screenName) { success ->
            promise.resolve(success)
        }
    }
}