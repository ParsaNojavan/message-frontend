import { Injectable, signal, computed, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { Conversation } from '../../models/conversation.model';
import { AuthService } from '../auth/auth.service';
import { SocketService } from '../socket/socket.service';
import { BackendMessagesResponse } from '../../models/dto/message.dto';
import { RoomMuteResponse } from '../../models/dto/roomMute.dto';
import { Message, MessageMediaItem, MessageReaction, MessageReply } from '../../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  private readonly API_URL = 'http://localhost:3000';

  readonly conversations = signal<Conversation[]>([]);
  readonly activeConversationId = signal<string | number | null>(null);
  readonly messages = signal<Record<string | number, Message[]>>({});
  
  // نگه‌داشتن پیام والد در حال ریپلای
  readonly replyingToMessage = signal<Message | null>(null);

  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    return this.conversations().find(c => String(c.id) === String(id)) ?? null;
  });

  readonly isActiveConversationMuted = computed(() => {
    const active = this.activeConversation();
    if (!active || !active.mutedUntil) return false;
    return new Date(active.mutedUntil).getTime() > Date.now();
  });

  readonly currentMessages = computed(() => {
    const id = this.activeConversationId();
    if (!id) return [];
    return this.messages()[id] || [];
  });

  constructor() {
    this.initSocketListeners();

    effect(() => {
      const id = this.activeConversationId();
      if (id) {
        this.handleConversationChange(id);
      }
    }, { allowSignalWrites: true });
  }

  private handleConversationChange(id: string | number) {
    this.socketService.emit('room.join', { roomId: String(id) });

    this.conversations.update(chats =>
      chats.map(chat => String(chat.id) === String(id) ? { ...chat, unreadCount: 0 } : chat)
    );

    // لغو ریپلای با سوئیچ چت
    this.replyingToMessage.set(null);

    if (!this.messages()[id]) {
      this.loadMessages(id);
    }
  }

  private normalizeReply(rawReply: any): MessageReply | null {
    if (!rawReply) return null;
    if (typeof rawReply === 'string' || typeof rawReply === 'number') {
      return { id: rawReply, content: 'پیام ارجاع‌شده' };
    }
    return {
      id: rawReply._id || rawReply.id,
      content: rawReply.content || rawReply.message || '',
      senderName: rawReply.senderName || (rawReply.senderId ? String(rawReply.senderId) : undefined),
      senderId: rawReply.senderId ? String(rawReply.senderId) : undefined
    };
  }

  private initSocketListeners() {
    // 1. دریافت پیام جدید (سوکت)
    this.socketService.listen<any>('room.message.new')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incomingMsg) => {
          const currentUserId = this.authService.currentUser();
          const roomId = String(incomingMsg.roomId);
          const isSender = String(incomingMsg.senderId) === String(currentUserId);
          const serverMsgId = incomingMsg._id || incomingMsg.id;

          const formattedMessage: Message = {
            id: serverMsgId,
            conversationId: roomId,
            content: incomingMsg.content || incomingMsg.message || '',
            time: incomingMsg.createdAt || new Date().toISOString(),
            isSender,
            status: incomingMsg.isRead ? 'read' : 'sent',
            replyTo: this.normalizeReply(incomingMsg.replyTo),
            reactions: incomingMsg.reactions || [],
            media: incomingMsg.media || [],
            isForwarded: incomingMsg.isForwarded || false,
            isEdited: incomingMsg.isEdited || false
          };

          this.messages.update(allMessages => {
            const currentRoomMsgs = allMessages[roomId] || [];

            // اگر خود کاربر فرستاده بود، پیام optimistic موقت جایگزین شود
            if (isSender) {
              const tempIndex = currentRoomMsgs.findIndex(
                m => m.status === 'sending' && m.content === formattedMessage.content
              );

              if (tempIndex !== -1) {
                const updatedList = [...currentRoomMsgs];
                updatedList[tempIndex] = formattedMessage;
                return { ...allMessages, [roomId]: updatedList };
              }
            }

            const exists = currentRoomMsgs.some(m => String(m.id) === String(serverMsgId));
            if (!exists) {
              return {
                ...allMessages,
                [roomId]: [...currentRoomMsgs, formattedMessage]
              };
            }

            return allMessages;
          });

          this.updateConversationMetadata(roomId, formattedMessage.content, formattedMessage.time, isSender);
        },
        error: (err) => console.error('Socket newMessage error:', err)
      });

    // 2. به‌روزرسانی زنده ری‌اکشن‌ها
    this.socketService.listen<{ messageId: string | number; roomId?: string | number; reactions: MessageReaction[] }>('room.message.reaction.updated')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ messageId, roomId, reactions }) => {
          this.messages.update(allMessages => {
            const targetRoomId = roomId ? String(roomId) : (this.activeConversationId() ? String(this.activeConversationId()) : null);
            if (!targetRoomId || !allMessages[targetRoomId]) return allMessages;

            const roomMsgs = allMessages[targetRoomId];
            const targetIndex = roomMsgs.findIndex(m => String(m.id) === String(messageId));

            if (targetIndex === -1) return allMessages;

            const updatedMessages = [...roomMsgs];
            updatedMessages[targetIndex] = {
              ...updatedMessages[targetIndex],
              reactions: reactions
            };

            return {
              ...allMessages,
              [targetRoomId]: updatedMessages
            };
          });
        },
        error: (err) => console.error('Socket reaction update error:', err)
      });
  }

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
              console.warn('Error getting users presences: ', err);
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
              targetUserId,
              name: room.otherUser?.firstName
                ? `${room.otherUser.firstName} ${room.otherUser.lastName || ''}`.trim()
                : room.name || 'No Name Chat',
              type: room.type,
              avatar: room.otherUser?.photoUrl || room.avatar,
              lastMessage: room.lastMessage || 'No Messages',
              lastMessageTime: room.updatedAt || '',
              unreadCount: room.unreadCount || 0,
              phoneNumber: room.otherUser?.phoneNumber || null,
              mutedUntil: room.mutedUntil ?? null,
              isOnline
            } as Conversation;
          });
        })
      )
      .subscribe({
        next: (mappedConversations) => {
          this.conversations.set(mappedConversations);
        },
        error: (error) => {
          console.error('Error loading chats: ', error);
        }
      });
  }

  loadMessages(roomId: string | number) {
    const currentUserId = this.authService.currentUser();

    this.http.get<BackendMessagesResponse>(`${this.API_URL}/chat/${roomId}/messages`)
      .pipe(
        map(response => {
          const msgs = response?.messages || [];
          return msgs.map(m => ({
            id: m._id,
            conversationId: m.roomId,
            content: m.content,
            time: m.createdAt,
            isSender: String(m.senderId) === String(currentUserId),
            status: m.isRead ? 'read' : 'sent',
            replyTo: this.normalizeReply((m as any).replyTo),
            reactions: (m as any).reactions || [],
            media: (m as any).media || [],
            isForwarded: (m as any).isForwarded || false,
            isEdited: (m as any).isEdited || false
          } as Message));
        })
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

  setActiveConversation(id: string | number | null) {
    this.activeConversationId.set(id);
  }

  setReplyTo(message: Message | null) {
    this.replyingToMessage.set(message);
  }

  cancelReply() {
    this.replyingToMessage.set(null);
  }

  sendMessage(text: string, media?: MessageMediaItem[]) {
    const activeId = this.activeConversationId();
    if (!activeId || (!text.trim() && (!media || media.length === 0))) return;

    const trimmedText = text.trim();
    const nowIso = new Date().toISOString();
    const currentReply = this.replyingToMessage();

    const payload: {
      roomId: string;
      message: string;
      media?: MessageMediaItem[];
      replyTo?: string;
    } = {
      roomId: String(activeId),
      message: trimmedText,
    };

    if (media && media.length > 0) {
      payload.media = media;
    }

    if (currentReply) {
      payload.replyTo = String(currentReply.id);
    }

    // اضافه کردن اپتیمیستیک به لیست با وضعیت sending
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId: activeId,
      content: trimmedText,
      time: nowIso,
      isSender: true,
      status: 'sending',
      replyTo: currentReply ? {
        id: currentReply.id,
        content: currentReply.content,
        senderName: currentReply.isSender ? 'شما' : undefined
      } : null,
      reactions: [],
      media: media || []
    };

    this.messages.update(all => ({
      ...all,
      [activeId]: [...(all[activeId] || []), optimisticMessage]
    }));

    this.updateConversationMetadata(activeId, trimmedText, nowIso, true);
    this.replyingToMessage.set(null);

    this.socketService.emit('room.message', payload);
  }

  sendReaction(messageId: string | number, emoji: string) {
    const activeId = this.activeConversationId();
    if (!activeId) return;

    const payload = {
      reaction: {
        messageId: String(messageId),
        roomId: String(activeId),
        emoji: emoji
      }
    };

    this.socketService.emit('room.message.react', payload);
  }

  muteRoom(roomId: string | number, durationMinutes: number) {
    return this.http.put<RoomMuteResponse>(`${this.API_URL}/chat/room-mute`, {
      roomId: String(roomId),
      durationMinutes
    }).pipe(
      tap((res) => {
        const updatedMutedUntil = res.data?.muted ?? null;
        this.conversations.update(chats =>
          chats.map(chat =>
            String(chat.id) === String(roomId)
              ? { ...chat, mutedUntil: updatedMutedUntil }
              : chat
          )
        );
      })
    );
  }

  unmuteRoom(roomId: string | number) {
    return this.muteRoom(roomId, 0);
  }

  toggleRoomMute(roomId: string | number, defaultDuration: number = -1) {
    const targetChat = this.conversations().find(c => String(c.id) === String(roomId));
    const isMuted = targetChat?.mutedUntil && new Date(targetChat.mutedUntil).getTime() > Date.now();

    return this.muteRoom(roomId, isMuted ? 0 : defaultDuration);
  }

  isRoomMuted(mutedUntil?: string | Date | null): boolean {
    if (!mutedUntil) return false;
    return new Date(mutedUntil).getTime() > Date.now();
  }

  private updateConversationMetadata(roomId: string | number, lastText: string, time: string, isSender: boolean) {
    this.conversations.update(chats =>
      chats.map(chat => {
        if (String(chat.id) === String(roomId)) {
          const isActiveChat = String(this.activeConversationId()) === String(roomId);
          return {
            ...chat,
            lastMessage: lastText,
            lastMessageTime: time,
            unreadCount: (isActiveChat || isSender) ? (isActiveChat ? 0 : chat.unreadCount) : (chat.unreadCount || 0) + 1
          };
        }
        return chat;
      })
    );
  }

  startDirectChat(targetUserId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/user/contacts/${targetUserId}/room`);
  }
}
