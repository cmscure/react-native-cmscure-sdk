#!/usr/bin/env bash
# Creates ./fresh: a new Expo SDK 55 app, installs the published
# @cmscure/react-native-cmscure-sdk@$VERSION from npm, reuses the example
# screen and app.json, and runs expo prebuild.
set -euo pipefail
npx -y create-expo-app@latest fresh --template blank-typescript@sdk-55 --no-install
cp example-expo/App.tsx fresh/App.tsx
cp example-expo/app.json fresh/app.json
cd fresh
npm install --no-audit --no-fund
npx expo install "@cmscure/react-native-cmscure-sdk@$VERSION"
node -e "const v=require('@cmscure/react-native-cmscure-sdk/package.json').version; if (v !== process.env.VERSION) { console.error('installed', v); process.exit(1); } console.log('installed from registry', v)"
npx expo prebuild --platform "${PLATFORM:-android}" --no-install
if [ "${PLATFORM:-android}" = ios ]; then (cd ios && pod install); fi
