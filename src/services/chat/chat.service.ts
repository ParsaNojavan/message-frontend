import { Injectable, signal, computed, inject } from '@angular/core';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { HttpClient } from '@angular/common/http';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface BackendMessagesResponse {
  messages: Array<{
    _id: string;
    roomId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    readBy: string[];
    type: string;
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

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly API_URL = 'http://localhost:3000';

  readonly conversations = signal<Conversation[]>([]);
  readonly activeConversationId = signal<string | number | null>(null);
  readonly messages = signal<Record<string | number, Message[]>>({});

  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    return this.conversations().find(c => c.id === id) ?? null;
  });

  readonly currentMessages = computed(() => {
    const id = this.activeConversationId();
    if (!id) return [];
    return this.messages()[id] || [];
  });

  loadConversations() {
    this.http.get<any>(`${this.API_URL}/chat/user-rooms`)
      .pipe(
        map(response => response?.data || []),
        switchMap((rooms: any[]) => {
          if (!Array.isArray(rooms) || rooms.length === 0) {
            return of({ rooms: [], statusMap: {} as Record<string, boolean> });
          }

          const userIds = rooms
            .map(room => room.targetUserId || room.otherUser?.id || room.otherUser?._id)
            .filter(Boolean)
            .map(id => String(id));

          if (userIds.length === 0) {
            return of({ rooms, statusMap: {} as Record<string, boolean> });
          }

          return this.http.post<any>(`${this.API_URL}/chat/users-status`, { userIds }).pipe(
            map(statusResponse => {

              const rawStatus = statusResponse?.data || statusResponse;
              const statusMap: Record<string, boolean> = {};

              if (typeof rawStatus === 'object' && rawStatus !== null) {
                Object.entries(rawStatus).forEach(([userId, status]) => {
                  statusMap[userId] = status === 'online';
                });
              }

              return { rooms, statusMap };
            }),
            catchError(err => {
              console.warn('Error getting users precenses: ', err);
              return of({ rooms, statusMap: {} as Record<string, boolean> });
            })
          );
        }),
        map(({ rooms, statusMap }) => {
          return rooms.map((room: any) => {
            const rawTargetId = room.targetUserId || room.otherUser?.id || room.otherUser?._id;
            const targetUserId: string | null = rawTargetId ? String(rawTargetId) : null;

            const isOnline = targetUserId ? (statusMap[targetUserId] ?? false) : false;

            return {
              id: room.id || room._id,
              name: room.otherUser?.firstName
                ? `${room.otherUser.firstName} ${room.otherUser.lastName || ''}`.trim()
                : room.name || 'No Name Chat',
              avatar: room.otherUser?.photoUrl || room.avatar || 'avatar.png',
              lastMessage: room.lastMessage || 'No Messages',
              lastMessageTime: room.updatedAt || '',
              unreadCount: room.unreadCount || 0,
              isOnline: isOnline
            } as Conversation;
          });
        })
      )
      .subscribe({
        next: (mappedConversations) => {
          this.conversations.set(mappedConversations);

          if (mappedConversations.length > 0 && !this.activeConversationId()) {
            this.activeConversationId.set(mappedConversations[0].id);
          }
        },
        error: (error) => {
          console.error('Error loading chats: ', error);
        }
      });
  }

  loadMessages(roomId: string | number) {
    from(this.authService.currentUser())
      .pipe(
        switchMap(currentUserId =>
          this.http.get<BackendMessagesResponse>(`${this.API_URL}/chat/${roomId}/messages`).pipe(
            map(response => {
              const msgs = response?.messages || [];
              return msgs.map(m => ({
                id: m._id,
                conversationId: m.roomId,
                text: m.content,
                time: m.createdAt,
                isSender: String(m.senderId) === String(currentUserId),
                status: m.isRead ? 'read' : 'sent',
                type: m.type
              } as Message));
            })
          )
        )
      )
      .subscribe({
        next: (mappedMessages) => {
          this.messages.update(allMessages => ({
            ...allMessages,
            [roomId]: mappedMessages
          }));
        },
        error: (error) => {
          console.error(`Error loading messages for room ${roomId}:`, error);
        }
      });
  }

  setActiveConversation(id: string | number) {
    this.activeConversationId.set(id);
    this.loadMessages(id);
  }

  sendMessage(text: string) {
    const activeId = this.activeConversationId();
    if (!activeId || !text.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      conversationId: activeId,
      text: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isSender: true,
      status: 'sent'
    };

    this.messages.update(all => ({
      ...all,
      [activeId]: [...(all[activeId] || []), newMessage]
    }));
  }
}
