export interface SupportApiKey {
  key: string;
  createdAt: Date;
  domain?: string;
  isActive: boolean;
}

export interface SupportChatMessage {
  id: string;
  sender: 'visitor' | 'agent';
  text: string;
  timestamp: Date;
}

export interface SupportVisitorRoom {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorIp?: string;
  visitorLocation?: string;
  currentPage?: string;
  isOnline: boolean;
  unreadCount: number;
  lastMessage: string;
  updatedAt: Date;
  messages: SupportChatMessage[];
}
