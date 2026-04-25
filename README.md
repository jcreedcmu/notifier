Status
======

Android app that prompts you to record how you're doing every two
hours (9am, 11am, 1pm, 3pm, 5pm, 7pm). Tap the notification, pick a
value from -2 to 2, and it's saved to a local JSONL file on the
device. Built with Capacitor wrapping a simple web page.

## Prerequisites

- Node.js 22+
- Java JDK 17+ (full JDK, not JRE)
- Android SDK command-line tools (`ANDROID_HOME` set, `adb` on PATH)
- ImageMagick (`convert`) for icon generation

## Setup

    npm install

## Icons

Source images live in `assets/`. To regenerate all Android icon
resources from `assets/status.png` and `assets/status-small.png`:

    ./resize-icon.sh

## Build and install

    make install

This bundles the JS, syncs Capacitor, builds the debug APK, and
installs via `adb`. Your phone must be connected with USB debugging
enabled.

On first launch, grant notification permission when prompted.

## Data access

Status entries are stored in the app's internal storage as
`status-log.jsonl`. Each line looks like:

    {"time":"2026-04-25T14:30:00.000Z","state":1,"fireHour":13}

`time` is when the button was tapped. `fireHour` is present for
recurring notifications (the scheduled hour), absent for test
notifications.

Pull the file to your computer:

    adb exec-out run-as org.jcreed.status cat files/status-log.jsonl > status-log.jsonl

Clear the file on the device:

    adb exec-out run-as org.jcreed.status sh -c '> files/status-log.jsonl'

Both require the debug build and USB debugging.
