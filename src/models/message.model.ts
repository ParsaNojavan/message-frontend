export interface MessageUserDetail {
  _id: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  bio?: string;
}

export interface ReactionSummaryItemWithUsers {
  emoji: string;
  count: number;
  hasCurrentUser: boolean;
  userProfiles: Array<{
    name: string;
    avatar?: string;
  }>;
}

export interface MessageMediaItem {
  mediaId?: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  user?: MessageUserDetail | null;
  userName?: string; // fallback اختیاری
}

export interface ReactionSummaryItem {
  emoji: string;
  count: number;
  users: string[];
  hasCurrentUser: boolean;
}

export interface MessageReply {
  _id?: string;
  id?: string | number;
  content: string;
  senderId?: string;
  sender?: MessageUserDetail | null;
  senderName?: string;
  media?: MessageMediaItem[];
  type?: string;
}

export interface Message {
  id: string;
  _id?: string;
  conversationId?: string;
  roomId?: string;
  senderId?: string;
  content: string;
  time: string | Date;
  createdAt?: string | Date;
  isSender: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  sender?: MessageUserDetail | null;
  replyTo?: MessageReply | null;
  reactions?: MessageReaction[];
  media?: MessageMediaItem[];
  isForwarded?: boolean;
  isEdited?: boolean;
}
