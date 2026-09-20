import { Injectable, signal, computed, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { AuthService } from '../auth/auth.service';
import { SocketService } from '../socket/socket.service';
import { BackendMessagesResponse } from '../../models/dto/message.dto';
import { RoomMuteResponse } from '../../models/dto/roomMute.dto';

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
    this.socketService.emit('room.join', { roomId: id });

    this.conversations.update(chats =>
      chats.map(chat => String(chat.id) === String(id) ? { ...chat, unreadCount: 0 } : chat)
    );

    if (!this.messages()[id]) {
      this.loadMessages(id);
    }
  }

  private initSocketListeners() {
    this.socketService.listen<any>('room.message.new')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incomingMsg) => {
          const currentUserId = this.authService.currentUser();

          const roomId = incomingMsg.roomId;
          const isSender = String(incomingMsg.senderId) === String(currentUserId);

          if (isSender) return;

          const newMessage: Message = {
            id: incomingMsg._id || Date.now(),
            conversationId: roomId,
            text: incomingMsg.content || incomingMsg.message,
            time: incomingMsg.createdAt || new Date().toISOString(),
            isSender: false,
            status: 'sent'
          };

          this.messages.update(allMessages => ({
            ...allMessages,
            [roomId]: [...(allMessages[roomId] || []), newMessage]
          }));

          this.updateConversationMetadata(roomId, newMessage.text, newMessage.time, false);
        },
        error: (err) => console.error('Socket newMessage error:', err)
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
              targetUserId,
              name: room.otherUser?.firstName
                ? `${room.otherUser.firstName} ${room.otherUser.lastName || ''}`.trim()
                : room.name || 'No Name Chat',
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

          if (mappedConversations.length > 0 && !this.activeConversationId()) {
            this.router.navigate(['/chat', mappedConversations[0].id]);
          }
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
            text: m.content,
            time: m.createdAt,
            isSender: String(m.senderId) === String(currentUserId),
            status: m.isRead ? 'read' : 'sent'
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

  sendMessage(text: string) {
    const activeId = this.activeConversationId();
    if (!activeId || !text.trim()) return;

    const trimmedText = text.trim();
    const nowIso = new Date().toISOString();

    const payload = {
      roomId: activeId,
      message: trimmedText,
    };

    const newMessage: Message = {
      id: Date.now(),
      conversationId: activeId,
      text: trimmedText,
      time: nowIso,
      isSender: true,
      status: 'sent'
    };

    this.messages.update(all => ({
      ...all,
      [activeId]: [...(all[activeId] || []), newMessage]
    }));

    this.updateConversationMetadata(activeId, trimmedText, nowIso, true);

    this.socketService.emit('room.message', payload);
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
}