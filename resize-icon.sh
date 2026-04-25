#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <512x512.png>"
  exit 1
fi

SRC="$1"
RES=android/app/src/main/res

# Launcher icons
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

echo "Done"
