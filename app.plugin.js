// Expo config plugin for @cmscure/react-native-cmscure-sdk.
//
//   "plugins": ["@cmscure/react-native-cmscure-sdk"]
//
// What it does on `expo prebuild`:
// * iOS: the SDK is Swift and depends on Swift pods (Socket.IO-Client-Swift,
//   Starscream, Kingfisher), so CocoaPods must build frameworks. Sets
//   ios.useFrameworks = "static" in ios/Podfile.properties.json (the same
//   key expo-build-properties writes). Pass { ios: { useFrameworks: false } }
//   if your app already manages this. Raises the iOS deployment target to
//   14.0 only when it is lower.
// * Android: makes sure minSdkVersion is at least 24. Autolinking does the rest.
const {
  createRunOncePlugin,
  withPodfileProperties,
  withGradleProperties,
} = require('expo/config-plugins');

const pkg = require('./package.json');

const MIN_IOS = '14.0';
const MIN_ANDROID_SDK = 24;

const versionLower = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y;
  }
  return false;
};

const withCMSCureIos = (config, { useFrameworks = 'static' } = {}) =>
  withPodfileProperties(config, (cfg) => {
    const props = cfg.modResults;
    if (useFrameworks) {
      const current = props['ios.useFrameworks'];
      if (current && current !== useFrameworks) {
        console.warn(
          `[cmscure] ios.useFrameworks is "${current}", the CMSCure SDK is tested with "${useFrameworks}". Keeping "${current}".`
        );
      } else {
        props['ios.useFrameworks'] = useFrameworks;
      }
    }
    const target = props['ios.deploymentTarget'];
    if (target && versionLower(target, MIN_IOS)) {
      props['ios.deploymentTarget'] = MIN_IOS;
    }
    return cfg;
  });

const withCMSCureAndroid = (config) =>
  withGradleProperties(config, (cfg) => {
    const item = cfg.modResults.find((p) => p.type === 'property' && p.key === 'android.minSdkVersion');
    if (item && Number(item.value) < MIN_ANDROID_SDK) {
      item.value = String(MIN_ANDROID_SDK);
    }
    return cfg;
  });

const withCMSCure = (config, props = {}) => {
  config = withCMSCureIos(config, props.ios || {});
  config = withCMSCureAndroid(config);
  return config;
};

module.exports = createRunOncePlugin(withCMSCure, pkg.name, pkg.version);
