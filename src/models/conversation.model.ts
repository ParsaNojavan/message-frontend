import { Message } from "./message.model";
import { User } from "./user.model";

export type ConversationType = 'DM' | 'GROUP' | 'CHANNEL';
export type ConversationFilter = 'ALL' | ConversationType;

export interface Conversation {
  id: string | number;
  name: string;
  avatar?: string;
  type: ConversationType;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  phoneNumber?: string
  mutedUntil?: string | Date | null;
}

export interface SearchResultItem {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fallbackText: string;
  fallbackBg?: string;
  type: 'chat' | 'channel' | 'bot' | 'service';
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
