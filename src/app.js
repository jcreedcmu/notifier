import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App } from '@capacitor/app';

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const DATA_FILE = 'status-log.jsonl';

const statusEl = document.getElementById('status');
const confirmationEl = document.getElementById('confirmation');
const historyEl = document.getElementById('history');
const submitBtn = document.getElementById('submit');
const stateButtons = document.querySelectorAll('.state-buttons button');

let selectedState = null;
let pendingExtra = null;

async function loadHistory() {
  try {
    const file = await Filesystem.readFile({
      path: DATA_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    const lines = file.data.trim().split('\n').filter(Boolean);
    const recent = lines.slice(-10).reverse();
    historyEl.innerHTML = recent.map(line => {
      const { time, state, comment } = JSON.parse(line);
      const d = new Date(time);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `<tr><td>${dateStr} ${timeStr}</td><td>${state}</td><td>${comment || ''}</td></tr>`;
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

  const notifications = HOURS.map((hour, i) =>
    makeNotification(i + 1, {
      schedule: { on: { hour, minute: 0 }, repeats: true },
      extra: { fireHour: hour },
    })
  );

  await LocalNotifications.schedule({ notifications });
  statusEl.textContent = 'Notifications scheduled for ' + HOURS.map(h => h + ':00').join(', ');
}

function makeNotification(id, { schedule, ...overrides } = {}) {
  return {
    id,
    title: 'Status Check',
    body: '',
    channelId: 'status',
    smallIcon: 'ic_notification',
    ...(schedule && { schedule: { allowWhileIdle: true, ...schedule } }),
    ...overrides,
  };
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

function selectState(value) {
  selectedState = value;
  stateButtons.forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.val, 10) === value);
  });
  submitBtn.disabled = false;
}

async function handleSubmit() {
  if (selectedState == null) return;

  await recordState(selectedState, pendingExtra);
  pendingExtra = null;

  // Reset selection
  selectedState = null;
  stateButtons.forEach(btn => btn.classList.remove('selected'));
  submitBtn.disabled = true;
  document.getElementById('comment').value = '';

  // Show confirmation
  confirmationEl.style.display = 'block';
  await loadHistory();

  setTimeout(() => {
    confirmationEl.style.display = 'none';
  }, 1500);
}

async function init() {
  await scheduleNotifications();
  await loadHistory();

  // Handle notification tap
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    pendingExtra = action.notification.extra;
  });

  // State button selection
  stateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      selectState(parseInt(btn.dataset.val, 10));
    });
  });

  // Submit button
  submitBtn.addEventListener('click', handleSubmit);

  // Test button
  document.getElementById('test').addEventListener('click', async () => {
    try {
      // Schedule using the same `on:` path as the real hourly alarms
      const target = new Date(Date.now() + 2 * 60 * 1000);
      const hour = target.getHours();
      const minute = target.getMinutes();
      await LocalNotifications.schedule({
        notifications: [makeNotification(99, {
          schedule: { on: { hour, minute } },
        })],
      });
      statusEl.textContent = `Test (on:) scheduled for ${hour}:${String(minute).padStart(2, '0')}`;
    } catch (err) {
      statusEl.textContent = 'Failed: ' + err.message;
    }
  });
}

init();
