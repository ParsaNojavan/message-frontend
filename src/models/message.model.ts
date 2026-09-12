export interface Message {
  id: string | number;
  conversationId: string | number;
  text: string;
  time: string;
  isSender: boolean;
  status?: 'sent' | 'delivered' | 'read';
  replyTo?: MessageReply;
  reactions?: MessageReaction[];
}

export interface MessageReply {
  senderName: string;
  text: string;
}

export interface ReactionSummaryItem {
  emoji: string;
  count: number;
  users: string[];
  hasCurrentUser: boolean;
}

export interface MessageReaction {
  userId: string,
  userName: string,
  emoji: string
}