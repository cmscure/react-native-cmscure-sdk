#!/usr/bin/env bash
# Installs the packed SDK (exactly what npm would ship) into example-expo.
# Usage: prepare-example.sh [expo-sdk-major]   (default: the version in example-expo/package.json)
set -euo pipefail
cd "$(dirname "$0")/../.."

rm -f ./*.tgz
npm pack --silent
TARBALL="$(ls "$PWD"/*.tgz)"

cd example-expo
CURRENT="$(node -p "require('./package.json').dependencies.expo.replace(/[^0-9.]/g, '').split('.')[0]")"
if [ -n "${1:-}" ] && [ "$1" != "$CURRENT" ]; then
  npm install --no-audit --no-fund "expo@^$1"
  npx expo install --fix
fi
npm install --no-audit --no-fund "$TARBALL"
npx expo config --type public > /dev/null
