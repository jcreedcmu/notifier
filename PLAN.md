# PWA Push Notifier — Setup Plan

## Goal

Minimal PWA hosted on GitHub Pages that receives push notifications
triggered by a script on your desktop.

## Prerequisites

- Node.js installed on desktop
- A GitHub account (for Pages hosting)
- Phone with a modern browser (iOS 16.4+ Safari, or any recent Android Chrome)

## Step 1: Create the project

```
mkdir ~/proj/notifier && cd ~/proj/notifier
npm init -y
npm install web-push
git init
```

## Step 2: Generate VAPID keys

```
npx web-push generate-vapid-keys
```

Save the output (public key + private key). Put them in a `.env` file
(gitignored) for the desktop push script:

```
VAPID_PUBLIC_KEY=BPxxx...
VAPID_PRIVATE_KEY=xxx...
```

## Step 3: Create the PWA static files

These go in a `docs/` directory (GitHub Pages can serve from `docs/`).

### `docs/manifest.json`

```json
{
  "name": "Notifier",
  "short_name": "Notifier",
  "start_url": "/notifier/",
  "display": "standalone"
}
```

(Adjust `start_url` to match your GitHub Pages path: `https://USERNAME.github.io/notifier/`)

### `docs/sw.js`

```js
self.addEventListener('push', e => {
  const data = e.data?.json() ?? { title: 'Event', body: 'Something happened' };
  e.waitUntil(
    self.registration.showNotification(data.title, { body: data.body })
  );
});
```

### `docs/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="manifest" href="manifest.json">
  <title>Notifier</title>
</head>
<body>
  <h1>Notifier</h1>
  <button id="subscribe">Enable Notifications</button>
  <pre id="output"></pre>
  <script>
    const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

    document.getElementById('subscribe').addEventListener('click', async () => {
      const reg = await navigator.serviceWorker.register('sw.js');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });
      const json = JSON.stringify(sub, null, 2);
      document.getElementById('output').textContent = json;
      // Copy this JSON and save it as subscription.json on your desktop
    });
  </script>
</body>
</html>
```

## Step 4: Push to GitHub and enable Pages

```
git add docs/
git commit -m "initial PWA files"
gh repo create notifier --public --source=. --push
```

Then in repo settings: Pages -> Source -> "Deploy from a branch" -> `main`, `/docs`.

Site will be live at `https://USERNAME.github.io/notifier/`.

## Step 5: Subscribe from your phone

1. Open `https://USERNAME.github.io/notifier/` on your phone
2. **iOS only**: tap Share -> "Add to Home Screen", then open from home screen
3. Tap "Enable Notifications", grant permission
4. Copy the subscription JSON shown on screen
5. Save it on your desktop as `subscription.json` in the project dir

## Step 6: Create the desktop push script

### `push.js`

```js
import webpush from 'web-push';
import { readFileSync } from 'fs';

const sub = JSON.parse(readFileSync('./subscription.json', 'utf-8'));

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const payload = JSON.stringify({
  title: process.argv[2] || 'Event',
  body: process.argv[3] || 'Something happened on your desktop'
});

webpush.sendNotification(sub, payload)
  .then(() => console.log('Sent'))
  .catch(err => console.error('Failed:', err));
```

Usage:

```
source .env  # or use dotenv
node push.js "Build done" "The build finished successfully"
```

## Step 7: Wire it to your desktop event

Call `push.js` from whatever triggers the event — a cron job, a shell
script, a build hook, etc. For example:

```bash
long-running-command && node ~/proj/notifier/push.js "Done" "Command finished"
```

## File layout

```
notifier/
  .env                 # VAPID keys (gitignored)
  .gitignore           # node_modules/, .env, subscription.json
  subscription.json    # from phone (gitignored)
  push.js              # desktop push script (not in docs/)
  package.json
  docs/
    index.html         # PWA page
    sw.js              # service worker
    manifest.json      # PWA manifest
```

## Notes

- The subscription can expire after weeks/months. If pushes stop working,
  re-visit the page on your phone and re-subscribe.
- GitHub Pages is just a static host — the push itself goes from your
  desktop directly to the browser vendor's push service (FCM/Mozilla).
  No server in the middle.
- To support multiple devices, save multiple subscription JSONs and loop
  over them in push.js.
