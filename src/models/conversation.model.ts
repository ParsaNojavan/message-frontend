import { Message } from "./message.model";
import { User } from "./user.model";

export interface Conversation {
  id: string | number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
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