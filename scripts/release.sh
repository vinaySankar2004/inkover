#!/bin/bash
# Archive Inkover for the App Store and upload it to App Store Connect.
# Needs Xcode signed in to team VSTTF2AM22 (Xcode, Settings, Accounts).
# Usage: scripts/release.sh               archive, export and upload
#        scripts/release.sh --no-upload   archive and export only, to check signing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/build"
ARCHIVE="$OUT/Inkover.xcarchive"
TEAM="VSTTF2AM22"
UPLOAD=1
[ "${1:-}" = "--no-upload" ] && UPLOAD=0

rm -rf "$OUT"
mkdir -p "$OUT"

echo "Archiving..."
xcodebuild archive \
  -project "$ROOT/Inkover/Inkover.xcodeproj" \
  -scheme Inkover \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  > "$OUT/archive.log" 2>&1 || { grep -E "error:" "$OUT/archive.log"; echo "Archive failed. Full log: $OUT/archive.log"; exit 1; }
echo "Archive succeeded."

DEST="export"
[ "$UPLOAD" = 1 ] && DEST="upload"

cat > "$OUT/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>$DEST</string>
  <key>teamID</key><string>$TEAM</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
EOF

echo "Exporting ($DEST)..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$OUT/ExportOptions.plist" \
  -exportPath "$OUT/export" \
  -allowProvisioningUpdates \
  > "$OUT/export.log" 2>&1 || { grep -E "error:" "$OUT/export.log"; echo "Export failed. Full log: $OUT/export.log"; exit 1; }

if [ "$UPLOAD" = 1 ]; then
  echo "Uploaded. The build appears in App Store Connect after processing, usually within fifteen minutes."
else
  echo "Exported to $OUT/export. Nothing was uploaded."
fi
