export type ConversationType = 'DM' | 'GROUP' | 'CHANNEL';
export type ConversationFilter = 'ALL' | ConversationType;
export type RoomRole = 'OWNER' | 'ADMIN' | 'MEMBER' | string;

export interface RoomUserDetail {
  _id: string;
  id?: string;
  phoneNumber?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export interface RoomLastMessage {
  content: string;
  createdAt: string;
  sender?: RoomUserDetail | null;
}

export interface Conversation {
  id: string | number;
  name: string;
  avatar?: string;
  type: ConversationType;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  pinned?: boolean;
  pinnedAt?: string | Date | null;
  bio?: string;
  phoneNumber?: string;
  mutedUntil?: string | Date | null;
  targetUserId?: string | null;
  role?: RoomRole;
  joinedAt?: string;
  lastMessageData?: RoomLastMessage | null;
  otherUser?: RoomUserDetail | null;
}

export interface SearchResultItem {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fallbackText: string;
  fallbackBg?: string;
  type: 'chat' | 'channel' | 'group' | 'dm';
  verified?: boolean;
  subInfo?: string;
  actionText?: string;
}

export interface RecentContact {
  id: string;
  name: string;
  avatar?: string;
  fallbackText: string;
  fallbackBg?: string;
}

export interface UploadPayload {
  files: File[];
  caption: string;
  type: 'media' | 'document' | 'audio' | 'camera';
}
