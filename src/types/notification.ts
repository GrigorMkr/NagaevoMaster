type NotificationType =
  | 'forum_reply'
  | 'listing_published'
  | 'listing_rejected'
  | 'moderation_pending';

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string;
    createdAt: string;
}

export type {
  NotificationType,
  NotificationItem,
}
