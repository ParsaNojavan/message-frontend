export interface BackendMessagesResponse {
  messages: Array<{
    _id: string;
    roomId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    readBy: string[];
    media: any[];
    isForwarded: boolean;
    isEdited: boolean;
    reactions: any[];
    createdAt: string;
    updatedAt: string;
    sender: {
      _id: string;
      phoneNumber: string;
    };
  }>;
  hasMore: boolean;
  nextCursor: string | null;
}