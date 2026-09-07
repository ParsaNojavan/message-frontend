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