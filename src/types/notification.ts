type NotificationType =
  | 'forum_reply'
  | 'listing_published'
  | 'listing_rejected'
  | 'moderation_pending'
  | 'friend_request'
  | 'friend_accepted'
  | 'group_invite';

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
