# FCM Push Notifier — Setup Plan

## Goal

Send notifications (with vibration) to an Android phone from a desktop
machine, using Firebase Cloud Messaging for delivery. No server needed.

## Architecture

```
Desktop ──── FCM ──── Android App (Capacitor)
```

- **Desktop**: `push.js` uses `firebase-admin` to send an FCM data
  message directly. No relay server.
- **FCM**: Free push delivery service (Google-operated).
- **Android App**: Capacitor-wrapped web page. Receives FCM messages,
  shows notifications with vibration. Displays its FCM token for
  one-time copy to the desktop.

## Prerequisites

- Google/Firebase account (free tier)
- Node.js on desktop
- Java JDK 17 (for Gradle/Android builds)

## Step 0: Set up Android SDK (no Android Studio needed)

All tools live under a local directory — nothing installed system-wide.

### Download command-line tools

```bash
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
curl -O https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest
rm commandlinetools-linux-11076708_latest.zip
```

### Set environment variables

Add to your shell profile (e.g. `~/.bashrc`):

```bash
export ANDROID_HOME=~/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

Then `source ~/.bashrc`.

### Install SDK packages

```bash
sdkmanager --licenses        # accept all licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Verify

```bash
sdkmanager --list_installed
adb --version
```

### Connect your phone

1. On phone: Settings → About phone → tap "Build number" 7 times to
   enable Developer options
2. Settings → Developer options → enable "USB debugging"
3. Connect phone via USB
4. Run `adb devices` — approve the prompt on phone
5. Should show your device listed

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
3. Download `google-services.json` — save it for Step 3

## Step 3: Build the Capacitor app

### Initialize Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/push-notifications @capacitor/clipboard @capacitor/local-notifications
npx cap init notifier com.jcreedcmu.notifier --web-dir public
npx cap add android
```

### Web page (`public/index.html`)

The Capacitor app serves the web page in `public/`. Rewrite it to:

- Import Capacitor plugins via `@capacitor/push-notifications` and
  `@capacitor/clipboard`
- On load: register for push notifications, fetch the FCM token,
  display it on screen
- Provide a "Copy Token" button using the Clipboard plugin
- Listen for incoming push notifications and show them via
  `@capacitor/local-notifications` with vibration

```js
import { PushNotifications } from '@capacitor/push-notifications';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';

// Request permission and register
await PushNotifications.requestPermissions();
await PushNotifications.register();

// Get token
PushNotifications.addListener('registration', ({ value: token }) => {
  document.getElementById('token').textContent = token;
});

// Receive push while in foreground — show as local notification
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  LocalNotifications.schedule({
    notifications: [{
      id: Date.now(),
      title: notification.data.title || 'Event',
      body: notification.data.body || '',
    }],
  });
});

// Copy button
document.getElementById('copy').addEventListener('click', async () => {
  const token = document.getElementById('token').textContent;
  await Clipboard.write({ string: token });
});
```

Note: Capacitor plugins use ES modules. The web code needs to be
bundled (e.g. with esbuild or vite) or loaded via a `<script type="module">`.

### Configure the notification channel

Create a notification channel with vibration in the Capacitor config.
In `capacitor.config.ts` (or `.json`):

```json
{
  "plugins": {
    "LocalNotifications": {
      "channels": [{
        "id": "notifier",
        "name": "Notifier",
        "importance": 4,
        "vibration": true
      }]
    }
  }
}
```

Then reference `channelId: "notifier"` when scheduling local
notifications.

### Add Firebase config

Copy `google-services.json` to `android/app/google-services.json`.

### Sync and build

```bash
npx cap sync
cd android && ./gradlew assembleDebug
```

### Install to phone

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

To rebuild after changes:

```bash
npx cap sync && cd android && ./gradlew assembleDebug && adb install app/build/outputs/apk/debug/app-debug.apk
```

## Step 4: Get the FCM token

1. Open the app on phone
2. Grant notification permission when prompted
3. Copy the displayed FCM token
4. Save on desktop as `fcm-token.txt`

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
                                # fcm-token.txt
  firebase-service-account.json # Firebase SA key (gitignored)
  fcm-token.txt                 # FCM token from phone (gitignored)
  push.js                       # desktop push script
  package.json
  capacitor.config.ts           # Capacitor config
  public/
    index.html                  # app UI (token display + copy button)
  android/                      # generated by `npx cap add android`
    app/
      google-services.json      # from Firebase
      ...
```

## Notes

- FCM tokens rotate occasionally. If pushes stop working, reopen the
  app, copy the new token, and update `fcm-token.txt`.
- Uses a **data message** (not a notification message) so the app
  always handles it, even in the foreground.
- When the app is in the background, FCM data messages are received
  by Capacitor's native layer, which shows the notification
  automatically.
- The notification channel controls vibration at the OS level
  (Android 8+), so vibration is reliable.
- No server, no accounts beyond Firebase, no ongoing costs.

## Cost

- Firebase Cloud Messaging: free, no limits for downstream messages.
- Total: $0.
