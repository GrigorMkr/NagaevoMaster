import { asArray } from '@/utils/apiGuards';
import { api } from './api';
import type { NotificationItem } from '@/types/notification';

async function fetchNotifications(): Promise<NotificationItem[]> {
    try {
        const response = await api.get<NotificationItem[]>('/notifications');
        return asArray<NotificationItem>(response.data);
    }
    catch {
        return [];
    }
}

export {
  fetchNotifications,
}
