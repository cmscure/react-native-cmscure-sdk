module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        manifestPath: 'src/main/AndroidManifest.xml',
        packageImportPath: 'import com.reactnativecmscuresdk.CMSCureSDKPackage;'
      },
      ios: {
        podspecPath: './react-native-cmscure-sdk.podspec'
      }
    }
  }
};