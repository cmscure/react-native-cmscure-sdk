#!/usr/bin/env bash
# Runs inside the emulator job: install the release APK, start it and wait for
# the smoke line from example-expo/App.tsx.
set -euo pipefail
APK="example-expo/android/app/build/outputs/apk/release/app-release.apk"
PKG="com.cmscure.example"

adb install -r "$APK"
adb logcat -c
adb shell am start -n "$PKG/.MainActivity"

for _ in $(seq 1 60); do
  if adb logcat -d -s ReactNativeJS:V | grep -q "CMSCURE_SMOKE_OK"; then
    adb logcat -d -s ReactNativeJS:V | grep "CMSCURE_SMOKE"
    adb shell pidof "$PKG" > /dev/null || { echo "app died after smoke line"; exit 1; }
    echo "Android smoke OK"
    exit 0
  fi
  sleep 2
done

echo "Smoke line not found. Last logs:"
adb logcat -d | grep -E "ReactNativeJS|AndroidRuntime|CMSCure" | tail -80 || true
exit 1
