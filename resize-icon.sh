#!/bin/bash
set -e

RES=android/app/src/main/res

# Launcher icons from assets/status.png
SRC=assets/status.png

convert "$SRC" -resize 48x48   "$RES/mipmap-mdpi/ic_launcher.png"
convert "$SRC" -resize 48x48   "$RES/mipmap-mdpi/ic_launcher_round.png"
convert "$SRC" -resize 72x72   "$RES/mipmap-hdpi/ic_launcher.png"
convert "$SRC" -resize 72x72   "$RES/mipmap-hdpi/ic_launcher_round.png"
convert "$SRC" -resize 96x96   "$RES/mipmap-xhdpi/ic_launcher.png"
convert "$SRC" -resize 96x96   "$RES/mipmap-xhdpi/ic_launcher_round.png"
convert "$SRC" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher.png"
convert "$SRC" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher_round.png"
convert "$SRC" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher.png"
convert "$SRC" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher_round.png"

# Adaptive icon foreground (108dp per density)
convert "$SRC" -resize 108x108 "$RES/mipmap-mdpi/ic_launcher_foreground.png"
convert "$SRC" -resize 162x162 "$RES/mipmap-hdpi/ic_launcher_foreground.png"
convert "$SRC" -resize 216x216 "$RES/mipmap-xhdpi/ic_launcher_foreground.png"
convert "$SRC" -resize 324x324 "$RES/mipmap-xxhdpi/ic_launcher_foreground.png"
convert "$SRC" -resize 432x432 "$RES/mipmap-xxxhdpi/ic_launcher_foreground.png"

# Notification small icon from assets/status-small.png
SRC=assets/status-small.png

mkdir -p "$RES/drawable-mdpi" "$RES/drawable-hdpi" "$RES/drawable-xhdpi" "$RES/drawable-xxhdpi" "$RES/drawable-xxxhdpi"
convert "$SRC" -resize 24x24 "$RES/drawable-mdpi/ic_notification.png"
convert "$SRC" -resize 36x36 "$RES/drawable-hdpi/ic_notification.png"
convert "$SRC" -resize 48x48 "$RES/drawable-xhdpi/ic_notification.png"
convert "$SRC" -resize 72x72 "$RES/drawable-xxhdpi/ic_notification.png"
convert "$SRC" -resize 96x96 "$RES/drawable-xxxhdpi/ic_notification.png"

echo "Done"
