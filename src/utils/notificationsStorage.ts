const READ_NOTIFICATIONS_KEY = 'nagaevomaster-read-notifications';

function loadReadNotificationIds(): Set<string> {
    try {
        const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
        if (!raw) {
            return new Set();
        }
        const parsed = JSON.parse(raw) as unknown;
        return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
    }
    catch {
        return new Set();
    }
}

function saveReadNotificationIds(ids: Set<string>) {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
}

function markNotificationRead(id: string) {
    const ids = loadReadNotificationIds();
    ids.add(id);
    saveReadNotificationIds(ids);
}

function markNotificationsRead(notificationIds: string[]) {
    const ids = loadReadNotificationIds();
    for (const id of notificationIds) {
        ids.add(id);
    }
    saveReadNotificationIds(ids);
}

function isNotificationUnread(id: string): boolean {
    return !loadReadNotificationIds().has(id);
}

function countUnreadNotifications(notificationIds: string[]): number {
    const read = loadReadNotificationIds();
    return notificationIds.filter((id) => !read.has(id)).length;
}

export {
  READ_NOTIFICATIONS_KEY,
  loadReadNotificationIds,
  markNotificationRead,
  markNotificationsRead,
  isNotificationUnread,
  countUnreadNotifications,
}
