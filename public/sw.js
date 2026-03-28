self.addEventListener('push', e => {
  const data = e.data?.json() ?? { title: 'Event', body: 'Something happened' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon.png',
      vibrate: data.vibrate || [200, 100, 200],
    })
  );
});
