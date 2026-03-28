# FCM Push Notifier — Setup Plan

## Goal

Send notifications (with vibration) to an Android phone from a desktop
machine, using Firebase Cloud Messaging for delivery. No server needed.

## Architecture

```
Desktop ──── FCM ──── Android App
```

- **Desktop**: `push.js` uses `firebase-admin` to send an FCM data
  message directly. No relay server.
- **FCM**: Free push delivery service (Google-operated).
- **Android App**: Minimal Kotlin app that receives FCM messages and
  shows notifications with vibration. Displays its FCM token on screen
  for one-time copy to the desktop.

## Prerequisites

- Google/Firebase account (free tier)
- Android Studio (for building the app)
- Node.js on desktop (for the push script)

## Step 1: Create a Firebase project

1. Go to https://console.firebase.google.com/
2. Create a new project (e.g. "notifier")
3. Disable Google Analytics (not needed)
4. Go to Project Settings → Service accounts
5. Click "Generate new private key" — save the JSON file as
   `firebase-service-account.json` in this project dir (gitignored)

## Step 2: Create the Android app in Firebase

1. In the Firebase console, click "Add app" → Android
2. Package name: `com.jcreedcmu.notifier`
3. Download `google-services.json` — this goes in the Android app later
4. Skip the remaining setup wizard steps

## Step 3: Build the Android app

Create a minimal Android app (in `android/` subdirectory) with:

### Dependencies (build.gradle)

- `com.google.firebase:firebase-messaging` (FCM SDK)

### Components

1. **`MyFirebaseMessagingService`** — extends `FirebaseMessagingService`
   - `onMessageReceived(message)`: Build a notification with:
     - Title and body from the FCM data payload
     - Vibration pattern `[0, 500, 200, 500]`
     - The app icon
     - A notification channel with vibration enabled
   - `onNewToken(token)`: Log it (user can reopen the app to see it)

2. **`MainActivity`** — single activity that:
   - Creates the notification channel on startup (required for Android 8+)
   - Fetches the FCM token and displays it on screen with a "Copy" button
   - That's it

### Notification Channel

Create a channel (e.g. `"notifier_channel"`) with:
- Importance: HIGH (enables heads-up display)
- Vibration: enabled, pattern `[0, 500, 200, 500]`
- This is what actually controls vibration on Android 8+

## Step 4: Install the Android app

1. Build in Android Studio
2. Install on phone via USB or generate a signed APK
3. Open the app — copy the displayed FCM token
4. Save the token on your desktop as `fcm-token.txt` in the project dir

## Step 5: Set up the desktop push script

```bash
npm install firebase-admin
```

### `push.js`

```js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync('./firebase-service-account.json', 'utf-8'))
  ),
});

const token = readFileSync('./fcm-token.txt', 'utf-8').trim();

const message = {
  token,
  data: {
    title: process.argv[2] || 'Event',
    body: process.argv[3] || 'Something happened',
  },
};

admin.messaging().send(message)
  .then(() => console.log('Sent'))
  .catch(err => console.error('Failed:', err));
```

### Usage

```bash
node push.js "Build done" "The build finished successfully"
```

## Step 6: Wire it to desktop events

```bash
long-running-command && node ~/proj/notifier/push.js "Done" "Command finished"
```

## File layout

```
notifier/
  .gitignore                    # node_modules/, firebase-service-account.json,
                                # fcm-token.txt, google-services.json
  firebase-service-account.json # Firebase SA key (gitignored)
  fcm-token.txt                 # FCM token from phone (gitignored)
  push.js                       # desktop push script
  package.json
  android/
    app/
      src/main/
        kotlin/.../MainActivity.kt
        kotlin/.../MyFirebaseMessagingService.kt
        AndroidManifest.xml
        res/...
      build.gradle.kts
      google-services.json      # from Firebase (gitignored)
```

## Notes

- FCM tokens rotate occasionally. If pushes stop working, reopen the
  app, copy the new token, and update `fcm-token.txt`.
- Uses a **data message** (not a notification message) so the Android
  app always handles it and controls the vibration, even in foreground.
- No server, no accounts beyond Firebase, no ongoing costs.

## Cost

- Firebase Cloud Messaging: free, no limits for downstream messages.
- Total: $0.
