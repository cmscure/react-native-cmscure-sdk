package com.reactnativecmscuresdk

import android.content.Context
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import java.net.URL

class CMSCureSDKModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val cureSDK = CMSCureSDK // Direct access to the object

    override fun getName(): String {
        return "CMSCureSDK"
    }

    companion object {
        private const val API_LEVEL_ERROR_CODE = "API_LEVEL_ERROR"
        // private const val GENERIC_ERROR_CODE = "SDK_ERROR" // Keep if used elsewhere
    }

    init {
        cureSDK.init(reactContext.applicationContext)
        observeContentUpdates()
    }

    private fun observeContentUpdates() {
        cureSDK.contentUpdateFlow
            .onEach { updatedIdentifier: String ->
                val eventBody = Arguments.createMap()
                when (updatedIdentifier) {
                    CMSCureSDK.ALL_SCREENS_UPDATED -> {
                        eventBody.putString("type", "ALL_SCREENS_UPDATED")
                    }
                    CMSCureSDK.COLORS_UPDATED -> {
                        eventBody.putString("type", "COLORS_UPDATED")
                    }
                    else -> { // Assumed to be a screen name
                        eventBody.putString("type", "SCREEN_UPDATED")
                        eventBody.putString("screenName", updatedIdentifier)
                    }
                }
                sendEvent("CMSCureContentUpdated", eventBody)
            }
            .catch { e: Throwable ->
                Log.e(name, "Error in contentUpdateFlow: ${e.message}", e)
                val errorBody = Arguments.createMap()
                errorBody.putString("type", "ERROR")
                errorBody.putString("error", "Error observing content updates: ${e.message}")
                sendEvent("CMSCureContentUpdated", errorBody)
            }
            .launchIn(moduleScope)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactApplicationContext.hasActiveCatalystInstance()) {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } else {
            Log.w(name, "Attempted to send event '$eventName' without an active Catalyst instance.")
        }
    }

    @ReactMethod
    fun configure(options: ReadableMap, promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val projectId = options.getString("projectId")
                val apiKey = options.getString("apiKey")
                val projectSecret = options.getString("projectSecret")

                if (projectId.isNullOrBlank() || apiKey.isNullOrBlank() || projectSecret.isNullOrBlank()) {
                    promise.reject("CONFIG_ERROR_MISSING_PARAMS", "Missing required configuration options (projectId, apiKey, projectSecret).")
                    return
                }

                // serverUrl, socketIOUrl, and pollingIntervalSeconds are no longer passed from JS.
                // They are hardcoded in the core CMSCureSDK.kt

                cureSDK.configure(
                    context = reactApplicationContext.applicationContext,
                    projectId = projectId,
                    apiKey = apiKey,
                    projectSecret = projectSecret
                    // No URL or polling parameters passed here
                )
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("CONFIG_ERROR_EXCEPTION", "Configuration failed: ${e.message}", e)
            }
        } else {
            val errorMessage = "CMSCureSDK.configure requires Android API level 26 (Oreo) or higher. SDK cannot be configured on this device."
            Log.w(name, errorMessage)
            promise.reject(API_LEVEL_ERROR_CODE, errorMessage)
        }
    }

    @ReactMethod
    fun setLanguage(languageCode: String, force: Boolean, promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                if (languageCode.isBlank()) {
                    promise.reject("SET_LANG_ERROR_INVALID_PARAM", "languageCode cannot be blank.")
                    return
                }
                cureSDK.setLanguage(languageCode, force)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("SET_LANG_ERROR_EXCEPTION", "Failed to set language: ${e.message}", e)
            }
        } else {
            val errorMessage = "CMSCureSDK.setLanguage requires Android API level 26 (Oreo) or higher. Language setting may not work as expected."
            Log.w(name, errorMessage)
            promise.reject(API_LEVEL_ERROR_CODE, errorMessage)
        }
    }

    @ReactMethod
    fun getLanguage(promise: Promise) {
        try {
            val lang = cureSDK.getLanguage()
            promise.resolve(lang)
        } catch (e: Exception) {
            promise.reject("GET_LANG_ERROR", "Failed to get language: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getAvailableLanguages(promise: Promise) {
        try {
            cureSDK.availableLanguages { languagesList: List<String> ->
                val writableArray = Arguments.createArray()
                languagesList.forEach { lang: String -> writableArray.pushString(lang) }
                promise.resolve(writableArray)
            }
        } catch (e: Exception) {
            promise.reject("GET_AVAIL_LANGS_ERROR", "Failed to get available languages: ${e.message}", e)
        }
    }

    @ReactMethod
    fun translation(key: String, tab: String, promise: Promise) {
        try {
            if (key.isBlank() || tab.isBlank()) {
                promise.reject("TRANSLATION_ERROR_INVALID_PARAMS", "Key and tab cannot be blank for translation.")
                return
            }
            val trans = cureSDK.translation(key, tab)
            promise.resolve(trans)
        } catch (e: Exception) {
            promise.reject("TRANSLATION_ERROR_EXCEPTION", "Failed to get translation: ${e.message}", e)
        }
    }

    @ReactMethod
    fun colorValue(key: String, promise: Promise) {
        try {
            if (key.isBlank()) {
                promise.reject("COLOR_ERROR_INVALID_PARAM", "Key cannot be blank for colorValue.")
                return
            }
            val color = cureSDK.colorValue(key)
            promise.resolve(color)
        } catch (e: Exception) {
            promise.reject("COLOR_ERROR_EXCEPTION", "Failed to get color value: ${e.message}", e)
        }
    }

    @ReactMethod
    fun imageUrl(key: String, tab: String, promise: Promise) {
        try {
            if (key.isBlank() || tab.isBlank()) {
                promise.reject("IMAGE_URL_ERROR_INVALID_PARAMS", "Key and tab cannot be blank for imageUrl.")
                return
            }
            val url: URL? = cureSDK.imageUrl(key, tab)
            promise.resolve(url?.toString())
        } catch (e: Exception) {
            promise.reject("IMAGE_URL_ERROR_EXCEPTION", "Failed to get image URL: ${e.message}", e)
        }
    }

    @ReactMethod
    fun sync(screenName: String, promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                if (screenName.isBlank()) {
                    promise.reject("SYNC_ERROR_INVALID_PARAM", "screenName cannot be blank for sync.")
                    return
                }
                cureSDK.sync(screenName) { success: Boolean ->
                    if (success) {
                        promise.resolve(null)
                    } else {
                        promise.reject("SYNC_FAILED", "Sync operation failed for screen: $screenName. Check native logs for details.")
                    }
                }
            } catch (e: Exception) {
                promise.reject("SYNC_ERROR_EXCEPTION", "Sync failed for screen '$screenName': ${e.message}", e)
            }
        } else {
            val errorMessage = "CMSCureSDK.sync requires Android API level 26 (Oreo) or higher. Sync for '$screenName' was not performed."
            Log.w(name, errorMessage)
            promise.reject(API_LEVEL_ERROR_CODE, errorMessage)
        }
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        try {
            val connected = cureSDK.isConnected()
            promise.resolve(connected)
        } catch (e: Exception) {
            promise.reject("IS_CONNECTED_ERROR", "Failed to check connection status: ${e.message}", e)
        }
    }

    @ReactMethod
    fun setDebugLogsEnabled(enabled: Boolean, promise: Promise) {
        try {
            cureSDK.debugLogsEnabled = enabled
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SET_LOGS_ERROR", "Failed to set debug logs enabled: ${e.message}", e)
        }
    }

    @ReactMethod
    fun clearCache(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) { // If clearCache itself uses O+ APIs
            try {
               cureSDK.clearCache()
               promise.resolve(null)
            } catch (e: Exception) {
               promise.reject("CLEAR_CACHE_ERROR", "Failed to clear cache: ${e.message}", e)
            }
        } else {
            val errorMessage = "CMSCureSDK.clearCache may require Android API level 26 (Oreo) or higher for full functionality. Cache clearing may not be complete."
            Log.w(name, errorMessage)
            // Decide if you want to reject or resolve with a warning.
            // For consistency with other O-dependent methods, rejecting is clearer.
            promise.reject(API_LEVEL_ERROR_CODE, errorMessage)
        }
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                cureSDK.connectSocketIfNeeded()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("START_LISTENING_ERROR", "Failed to start listening: ${e.message}", e)
            }
        } else {
            val errorMessage = "CMSCureSDK.startListening (socket connection) requires Android API level 26 (Oreo) or higher. Socket connection may fail or not be attempted."
            Log.w(name, errorMessage)
            promise.reject(API_LEVEL_ERROR_CODE, errorMessage)
        }
    }

    @ReactMethod
    fun getKnownTabs(promise: Promise) {
        try {
            val tabsArray = cureSDK.getKnownProjectTabsArray()
            val writableArray = Arguments.fromList(tabsArray)
            promise.resolve(writableArray)
        } catch (e: Exception) {
            promise.reject("GET_KNOWN_TABS_ERROR", "Failed to get known tabs: ${e.message}", e)
        }
    }

    // Required for NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}
