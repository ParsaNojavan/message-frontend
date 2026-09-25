export interface MessageMediaItem {
  mediaId?: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
}

export interface MessageReaction {
  userId: string;
  userName?: string;
  emoji: string;
  createdAt?: string | Date;
}

export interface ReactionSummaryItem {
  emoji: string;
  count: number;
  users: string[];
  hasCurrentUser: boolean;
}

export interface MessageReply {
  id: string | number;
  content: string;
  senderName?: string;
  senderId?: string;
}

export interface Message {
  id: string | number;
  conversationId: string | number;
  content: string;
  time: string;
  isSender: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: MessageReply | null;
  reactions?: MessageReaction[];
  media?: MessageMediaItem[];
  isForwarded?: boolean;
  isEdited?: boolean;
}