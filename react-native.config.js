// react-native.config.js
module.exports = {
  dependency: {
    platforms: {
      android: {
        // this must point to your library’s Android folder
        sourceDir: "android",
        // (optional) explicitly point to your Manifest
        manifestPath: "android/src/main/AndroidManifest.xml"
      }
    }
  }
};