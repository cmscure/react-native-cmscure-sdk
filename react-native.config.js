module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        manifestPath: 'android/src/main/AndroidManifest.xml',
        packageImportPath: 'import com.reactnativecmscuresdk.CMSCureSDKPackage;'
      },
      ios: {
        podspecPath: './ios/CMSCureSDK.podspec'
      }
    }
  }
};