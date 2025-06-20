package com.cmscure.sdk

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

class CMSCureSDKModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.Main)
    private val CONTENT_UPDATED_EVENT = "onContentUpdated"

    init {
        CMSCureSDK.init(reactContext.applicationContext)
        listenForContentUpdates()
    }

    override fun getName() = "CMSCureSDKModule"

    private fun listenForContentUpdates() {
        scope.launch {
            CMSCureSDK.contentUpdateFlow.collect {
                // The new SDK emits a UUID. We just need to signal a generic update.
                // We'll let the JS layer re-fetch what it needs.
                sendEvent(mapOf("type" to "fullSync"))
            }
        }
    }
    
    private fun sendEvent(payload: Map<String, Any?>) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(CONTENT_UPDATED_EVENT, Arguments.makeNativeMap(payload))
    }

    @ReactMethod
    fun configure(config: ReadableMap) {
        val projectId = config.getString("projectId")
        val apiKey = config.getString("apiKey")
        if (projectId != null && apiKey != null) {
            CMSCureSDK.configure(reactContext.applicationContext, projectId, apiKey)
        }
    }
    
    @ReactMethod
    fun getStoreItems(screenName: String, promise: Promise) {
     try {
       val items: List<DataStoreItem> = CMSCureSDK.getStoreItems(screenName)
       val jsArray: WritableArray = Arguments.createArray()
       items.forEach { item ->
         jsArray.pushMap(item.toWritableMap())
       }
       promise.resolve(jsArray)
     } catch (e: Exception) {
       promise.reject("GET_STORE_ITEMS_FAILED", e)
     }
   }

    @ReactMethod
    fun syncStore(apiIdentifier: String, promise: Promise) {
        CMSCureSDK.syncStore(apiIdentifier) { success ->
            promise.resolve(success)
        }
    }

    @ReactMethod
    fun setLanguage(languageCode: String, promise: Promise) {
       // The Kotlin SDK's setLanguage is fire-and-forget but triggers async syncs.
       // We can resolve immediately after calling it.
        try {
            CMSCureSDK.setLanguage(languageCode)
            promise.resolve("Language set to $languageCode.")
        } catch (e: Exception) {
            promise.reject("set_language_failed", e)
        }
    }

    @ReactMethod
    fun getLanguage(promise: Promise) {
        promise.resolve(CMSCureSDK.getLanguage())
    }

    @ReactMethod
    fun availableLanguages(promise: Promise) {
        CMSCureSDK.availableLanguages { languages ->
            val writableArray = Arguments.createArray()
            languages.forEach { writableArray.pushString(it) }
            promise.resolve(writableArray)
        }
    }

    @ReactMethod
    fun translation(key: String, tab: String, promise: Promise) {
        promise.resolve(CMSCureSDK.translation(key, tab))
    }

    @ReactMethod
    fun colorValue(key: String, promise: Promise) {
        promise.resolve(CMSCureSDK.colorValue(key))
    }
    
    @ReactMethod
    fun imageURL(key: String, promise: Promise) {
        try {
                // CMSCureSDK.imageURL returns String?, so coalesce to empty string if null
                val urlOrEmpty: String = CMSCureSDK.imageURL(key) ?: ""
                promise.resolve(urlOrEmpty)
            } catch (e: Exception) {
                promise.reject("IMAGE_URL_FAILED", e)
            }
    }

    @ReactMethod
    fun sync(screenName: String, promise: Promise) {
        CMSCureSDK.sync(screenName) { success ->
            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("sync_failed", "Sync failed for screen: $screenName")
            }
        }
    }
}

// Helper extension functions to convert data models to WritableMaps for React Native
fun DataStoreItem.toWritableMap(): WritableMap = Arguments.createMap().apply {
    putString("id", id)
    putMap("data", Arguments.makeNativeMap(data.mapValues { it.value.toWritableMap() }))
    putString("createdAt", createdAt)
    putString("updatedAt", updatedAt)
}

fun JSONValue.toWritableMap(): WritableMap = Arguments.createMap().apply {
    putString("stringValue", stringValue)
    putInt("intValue", intValue ?: 0) // Or handle null appropriately
    putDouble("doubleValue", doubleValue ?: 0.0)
    putBoolean("boolValue", boolValue ?: false)
    putString("localizedString", localizedString)
}