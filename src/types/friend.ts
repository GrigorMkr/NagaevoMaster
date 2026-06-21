interface FriendUser {
  id: string;
  name: string;
  login: string;
  avatarUrl?: string;
}

type FriendRelation = 'none' | 'friends' | 'pending_sent' | 'pending_received';

interface FriendEntry {
  id: string;
  status: string;
  direction: 'incoming' | 'outgoing';
  user: FriendUser;
  createdAt: string;
}

interface FriendSearchResult extends FriendUser {
  relation: FriendRelation;
  friendshipId?: string;
}

interface FriendsOverview {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

export type {
  FriendUser,
  FriendRelation,
  FriendEntry,
  FriendSearchResult,
  FriendsOverview,
}
