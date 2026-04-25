import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App } from '@capacitor/app';

const HOURS = [9, 11, 13, 15, 17, 19];
const DATA_FILE = 'status-log.jsonl';

const statusEl = document.getElementById('status');
const buttonsEl = document.getElementById('buttons');
const confirmationEl = document.getElementById('confirmation');

let pendingFireHour = null;

async function scheduleNotifications() {
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') {
    statusEl.textContent = 'Notification permission denied (display: ' + perm.display + ')';
    return;
  }

  await LocalNotifications.createChannel({
    id: 'status',
    name: 'Status',
    importance: 4,
    vibration: true,
  });

  // Cancel any existing scheduled notifications before rescheduling
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending);
  }

  const notifications = HOURS.map((hour, i) => ({
    id: i + 1,
    title: 'Status Check',
    body: 'How are you?',
    schedule: {
      on: { hour, minute: 0 },
      repeats: true,
    },
    channelId: 'status',
    extra: { fireHour: hour },
  }));

  await LocalNotifications.schedule({ notifications });
  statusEl.textContent = 'Notifications scheduled for ' + HOURS.map(h => h + ':00').join(', ');
}

function computeFireTime(fireHour) {
  const now = new Date();
  const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), fireHour, 0, 0, 0);
  // If current time is before the fire hour, the notification was from yesterday
  if (now < fire) {
    fire.setDate(fire.getDate() - 1);
  }
  return fire.toISOString();
}

async function recordState(value, fireHour) {
  const entry = {
    time: computeFireTime(fireHour),
    state: value,
  };
  const line = JSON.stringify(entry) + '\n';

  try {
    await Filesystem.appendFile({
      path: DATA_FILE,
      data: line,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  } catch {
    // File doesn't exist yet, create it
    await Filesystem.writeFile({
      path: DATA_FILE,
      data: line,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  }
}

function showButtons(fireHour) {
  pendingFireHour = fireHour;
  buttonsEl.style.display = 'block';
  confirmationEl.style.display = 'none';
  statusEl.textContent = '';
}

async function handleButtonClick(value) {
  buttonsEl.style.display = 'none';
  confirmationEl.style.display = 'block';

  await recordState(value, pendingFireHour);

  setTimeout(() => {
    App.minimizeApp();
  }, 500);
}

async function init() {
  await scheduleNotifications();

  // Handle notification tap
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const fireHour = action.notification.extra?.fireHour;
    if (fireHour != null) {
      showButtons(fireHour);
    }
  });

  // Test button — schedule a notification 1 minute from now
  document.getElementById('test').addEventListener('click', async () => {
    try {
      const at = new Date(Date.now() + 5 * 1000);
      const result = await LocalNotifications.schedule({
        notifications: [{
          id: 99,
          title: 'Status Check',
          body: 'How are you? (test)',
          schedule: { at: at.toISOString() },
          channelId: 'status',
          extra: { fireHour: at.getHours() },
        }],
      });
      statusEl.textContent = 'Test scheduled for ' + at.toLocaleTimeString();
    } catch (err) {
      statusEl.textContent = 'Failed: ' + err.message;
    }
  });

  // Button click handlers
  document.querySelectorAll('#buttons button').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleButtonClick(parseInt(btn.dataset.val, 10));
    });
  });
}

init();
