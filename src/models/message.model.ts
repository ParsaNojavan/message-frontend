export interface Message {
  id: string | number;
  conversationId: string | number;
  text: string;
  time: string;
  isSender: boolean;
  status?: 'sent' | 'delivered' | 'read';
  replyTo?: MessageReply;
}

export interface MessageReply {
  senderName: string;
  text: string;
}