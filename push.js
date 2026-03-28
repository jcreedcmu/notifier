import admin from 'firebase-admin';
import { readFileSync } from 'fs';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync('./firebase-service-account.json', 'utf-8'))
  ),
});

const token = readFileSync('./fcm-token.txt', 'utf-8').trim();

const title = process.argv[2] || 'Event';
const body = process.argv[3] || 'Something happened';

const message = {
  token,
  notification: {
    title,
    body,
  },
  data: {
    title,
    body,
  },
  android: {
    notification: {
      channelId: 'notifier-0-150-100-150-100-150-100-500',
    },
  },
};

admin.messaging().send(message)
  .then(() => console.log('Sent'))
  .catch(err => console.error('Failed:', err));
