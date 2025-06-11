package com.cmscure.sdk

import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CMSCureSDKModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.IO)
    private val CONTENT_UPDATED_EVENT = "onContentUpdated"

    init {
        // Initialize the SDK as soon as the module is created
        CMSCureSDK.init(reactContext.applicationContext)
        listenForContentUpdates()
    }

    override fun getName() = "CMSCureSDKModule"

    private fun listenForContentUpdates() {
        scope.launch {
            CMSCureSDK.contentUpdateFlow.collect { updatedIdentifier ->
                sendEvent(updatedIdentifier)
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap? = null) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    
    private fun sendEvent(body: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(CONTENT_UPDATED_EVENT, body)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    @ReactMethod
    fun configure(projectId: String, apiKey: String, projectSecret: String, promise: Promise) {
        try {
            CMSCureSDK.configure(
                context = reactContext.applicationContext,
                projectId = projectId,
                apiKey = apiKey,
                projectSecret = projectSecret
            )
            // Configuration is async internally. We resolve immediately.
            // Real-time updates will be handled by the event emitter.
            promise.resolve("Configuration process initiated.")
        } catch (e: Exception) {
            promise.reject("configure_failed", e)
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
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
    fun imageUrl(key: String, tab: String, promise: Promise) {
        promise.resolve(CMSCureSDK.imageUrl(key, tab)?.toString())
    }

    @ReactMethod
    fun imageURL(key: String, promise: Promise) {
        promise.resolve(CMSCureSDK.imageURL(key)?.toString())
    }

    @RequiresApi(Build.VERSION_CODES.O)
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