import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App } from '@capacitor/app';

const HOURS = [9, 11, 13, 15, 17, 19];
const DATA_FILE = 'status-log.jsonl';

const statusEl = document.getElementById('status');
const buttonsEl = document.getElementById('buttons');
const confirmationEl = document.getElementById('confirmation');

const historyEl = document.getElementById('history');

let pendingExtra = null;

async function loadHistory() {
  try {
    const file = await Filesystem.readFile({
      path: DATA_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    const lines = file.data.trim().split('\n').filter(Boolean);
    const recent = lines.slice(-10);
    historyEl.innerHTML = recent.map(line => {
      const { time, state } = JSON.parse(line);
      const d = new Date(time);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `<tr><td>${dateStr} ${timeStr}</td><td>${state}</td></tr>`;
    }).join('');
  } catch {
    // No file yet
  }
}

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
    smallIcon: 'ic_notification',
    extra: { fireHour: hour },
  }));

  await LocalNotifications.schedule({ notifications });
  statusEl.textContent = 'Notifications scheduled for ' + HOURS.map(h => h + ':00').join(', ');
}

async function recordState(value, extra) {
  const comment = document.getElementById('comment').value.trim();
  const entry = {
    time: new Date().toISOString(),
    state: value,
  };
  if (extra?.fireHour != null) {
    entry.fireHour = extra.fireHour;
  }
  if (comment) {
    entry.comment = comment;
  }
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

function showButtons(extra) {
  pendingExtra = extra;
  buttonsEl.style.display = 'block';
  confirmationEl.style.display = 'none';
  statusEl.textContent = '';
}

async function handleButtonClick(value) {
  buttonsEl.style.display = 'none';
  confirmationEl.style.display = 'block';

  await recordState(value, pendingExtra);
  await loadHistory();

  setTimeout(() => {
    App.minimizeApp();
  }, 500);
}

async function init() {
  await scheduleNotifications();
  await loadHistory();

  // Handle notification tap
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    showButtons(action.notification.extra);
  });

  // Test button — schedule a notification 5 seconds from now
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
          smallIcon: 'ic_notification',
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
