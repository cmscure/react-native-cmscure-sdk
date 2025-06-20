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
                    // Check if it's a datastore by trying to get items
                    val items = CMSCureSDK.getStoreItems(identifier)
                    if (items.isNotEmpty() || identifier in listOf("popular_destinations", "featured_destinations")) {
                        putString("type", "dataStore")
                    } else {
                        putString("type", "translation")
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
            val array = Arguments.createArray()
            
            items.forEach { item ->
                val map = Arguments.createMap().apply {
                    putString("id", item.id)
                    putString("createdAt", item.createdAt)
                    putString("updatedAt", item.updatedAt)
                    
                    val dataMap = Arguments.createMap()
                    item.data.forEach { (key, value) ->
                        // Create a JSON object for each value with all possible fields
                        val valueMap = Arguments.createMap().apply {
                            when (value) {
                                is JSONValue.StringValue -> {
                                    putString("stringValue", value.value)
                                    putString("localizedString", value.value)
                                }
                                is JSONValue.IntValue -> {
                                    putInt("intValue", value.value)
                                    putString("stringValue", value.value.toString())
                                    putString("localizedString", value.value.toString())
                                }
                                is JSONValue.DoubleValue -> {
                                    putDouble("doubleValue", value.value)
                                    putString("stringValue", value.value.toString())
                                    putString("localizedString", value.value.toString())
                                }
                                is JSONValue.BoolValue -> {
                                    putBoolean("boolValue", value.value)
                                    putString("stringValue", value.value.toString())
                                    putString("localizedString", value.value.toString())
                                }
                                is JSONValue.LocalizedStringValue -> {
                                    val localizedValue = value.localizedString
                                    putString("localizedString", localizedValue)
                                    putString("stringValue", localizedValue)
                                    // Also put the raw localized values
                                    val localesMap = Arguments.createMap()
                                    value.values.forEach { (lang, text) ->
                                        localesMap.putString(lang, text)
                                    }
                                    putMap("localizedValues", localesMap)
                                }
                                is JSONValue.NullValue -> {
                                    putNull("stringValue")
                                    putNull("localizedString")
                                }
                            }
                        }
                        dataMap.putMap(key, valueMap)
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
        CMSCureSDK.syncStore(apiIdentifier) { success ->
            promise.resolve(success)
        }
    }
    
    @ReactMethod
    fun sync(screenName: String, promise: Promise) {
        CMSCureSDK.sync(screenName) { success ->
            promise.resolve(success)
        }
    }
}