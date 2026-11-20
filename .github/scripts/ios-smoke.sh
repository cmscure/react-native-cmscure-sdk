#!/usr/bin/env bash
# Boots a simulator, installs the Release .app and waits for the smoke line
# from example-expo/App.tsx in the unified log.
set -euo pipefail
APP="$(ls -d ${APP_DIR:-example-expo}/ios/build/Build/Products/Release-iphonesimulator/*.app | head -1)"
BUNDLE_ID="com.cmscure.example"

UDID="$(xcrun simctl list devices available -j | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
for runtime in sorted(devices, reverse=True):
    if "iOS" not in runtime:
        continue
    for d in devices[runtime]:
        if d["name"].startswith("iPhone"):
            print(d["udid"]); sys.exit(0)
sys.exit(1)
')"

xcrun simctl boot "$UDID" || true
xcrun simctl bootstatus "$UDID" -b
xcrun simctl install "$UDID" "$APP"
START="$(date '+%Y-%m-%d %H:%M:%S')"
xcrun simctl launch "$UDID" "$BUNDLE_ID"

for _ in $(seq 1 45); do
  LINES="$(xcrun simctl spawn "$UDID" log show --start "$START" --style compact \
    --predicate 'eventMessage CONTAINS "CMSCURE_SMOKE"' 2>/dev/null | grep CMSCURE_SMOKE || true)"
  if echo "$LINES" | grep -q "CMSCURE_SMOKE_OK"; then
    echo "$LINES"
    echo "iOS smoke OK"
    exit 0
  fi
  if echo "$LINES" | grep -q "CMSCURE_SMOKE_FAIL"; then
    echo "$LINES"
    exit 1
  fi
  sleep 2
done

echo "Smoke line not found. Last app logs:"
xcrun simctl spawn "$UDID" log show --start "$START" --style compact \
  --predicate 'process CONTAINS "CMSCure" OR eventMessage CONTAINS "CMSCure"' 2>/dev/null | tail -80 || true
exit 1
