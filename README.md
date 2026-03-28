notifier
========

Minimal Android app that receives push notifications with custom
vibration patterns, triggered from a desktop script. Uses Firebase
Cloud Messaging for delivery and Capacitor to wrap a web page as a
native Android app.

## Prerequisites

- Node.js 22+
- Java JDK 17+ (full JDK, not JRE)
- Android SDK command-line tools (`ANDROID_HOME` set, `adb` on PATH)
- A Firebase project with an Android app registered as `org.jcreed.notifier`

## Setup

Place these files in the project root (all gitignored):

- `firebase-service-account.json` — from Firebase console → Project Settings → Service accounts → Generate new private key
- `google-services.json` — from Firebase console → Project Settings → General → Your apps
- `fcm-token.txt` — copied from the app after first install (see below)

Install dependencies:

    npm install

## Build and install

    make install

This bundles the JS, syncs Capacitor, builds the APK, and installs
via `adb`. Your phone must be connected with USB debugging enabled.

On first install, open the app, grant notification permission, and
tap "Copy Token". Save the token as `fcm-token.txt` in this directory.

## Send a notification

    node push.js "Title" "Body text"

## Changing the vibration pattern

Edit the `vibrationPattern` array in `src/app.js`. Then run
`make install`, open the app (to recreate the notification channel),
and update the `channelId` in `push.js` to match the new
pattern-derived ID (e.g. `notifier-0-150-100-150-100-150-100-500`).

No need to uninstall or re-copy the FCM token.
