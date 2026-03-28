import { PushNotifications } from '@capacitor/push-notifications';
import { Clipboard } from '@capacitor/clipboard';
import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin } from '@capacitor/core';

const VibrationChannel = registerPlugin('VibrationChannel');

const status = document.getElementById('status');
const tokenEl = document.getElementById('token');
const copyBtn = document.getElementById('copy');

async function init() {
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      status.textContent = 'Permission denied';
      return;
    }

    await LocalNotifications.requestPermissions();
    const vibrationPattern = [0, 150, 100, 150, 100, 150, 100, 500];
    const channelId = 'notifier-' + vibrationPattern.join('-');
    await VibrationChannel.createChannel({
      id: channelId,
      name: 'Notifier',
      importance: 4,
      vibrationPattern,
    });

    PushNotifications.addListener('registration', ({ value: token }) => {
      status.textContent = 'Registered';
      tokenEl.textContent = token;
      copyBtn.style.display = 'block';
    });

    PushNotifications.addListener('registrationError', (err) => {
      status.textContent = 'Registration failed: ' + err.error;
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      status.textContent = 'Push received: ' + JSON.stringify(notification);
      LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.data?.title || notification.title || 'Event',
          body: notification.data?.body || notification.body || '',
          channelId,
        }],
      });
    });

    await PushNotifications.register();
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  }
}

copyBtn.addEventListener('click', async () => {
  await Clipboard.write({ string: tokenEl.textContent });
  copyBtn.textContent = 'Copied!';
  setTimeout(() => copyBtn.textContent = 'Copy Token', 1500);
});

init();
