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
