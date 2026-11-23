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

type RoomKind = 'GROUP' | 'CHANNEL';

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

  /**
   * تبدیل و نرمال‌سازی دیتای ریپلای ارسالی از سرور با پشتیبانی از آبجکت کامل
   */
  private normalizeReply(rawReply: any): MessageReply | null {
    if (!rawReply) return null;

    if (typeof rawReply === 'string' || typeof rawReply === 'number') {
      return {
        id: String(rawReply),
        _id: String(rawReply),
        content: 'پیام ارجاع‌شده'
      };
    }

    const replyId = String(rawReply._id || rawReply.id || '');
    return {
      id: replyId,
      _id: replyId,
      content: rawReply.content || rawReply.message || '',
      senderId: rawReply.senderId ? String(rawReply.senderId) : undefined,
      sender: rawReply.sender || null,
      senderName: rawReply.senderName || undefined,
      media: rawReply.media || [],
      type: rawReply.type
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
          const serverMsgId = String(incomingMsg._id || incomingMsg.id);

          const formattedMessage: Message = {
            id: serverMsgId,
            _id: serverMsgId,
            conversationId: roomId,
            roomId: roomId,
            senderId: incomingMsg.senderId ? String(incomingMsg.senderId) : undefined,
            sender: incomingMsg.sender || null,
            content: incomingMsg.content || incomingMsg.message || '',
            time: incomingMsg.createdAt || new Date().toISOString(),
            createdAt: incomingMsg.createdAt || new Date().toISOString(),
            isSender,
            status: incomingMsg.isRead ? 'read' : 'sent',
            replyTo: this.normalizeReply(incomingMsg.replyTo),
            reactions: incomingMsg.reactions || [],
            media: incomingMsg.media || [],
            isForwarded: incomingMsg.isForwarded || false,
            forwardedFromUser: incomingMsg.forwardedFromUser || null,
            forwardedFromRoom: incomingMsg.forwardedFromRoom || null,
            isEdited: incomingMsg.isEdited || false
          };

          this.messages.update(allMessages => {
            const currentRoomMsgs = allMessages[roomId] || [];

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

            const exists = currentRoomMsgs.some(m => String(m.id) === serverMsgId || String(m._id) === serverMsgId);
            if (!exists) {
              return {
                ...allMessages,
                [roomId]: [...currentRoomMsgs, formattedMessage]
              };
            }

            return allMessages;
          });

          this.updateConversationMetadata(roomId, formattedMessage.content, String(formattedMessage.time), isSender);
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
            const targetIndex = roomMsgs.findIndex(m => String(m.id) === String(messageId) || String(m._id) === String(messageId));

            if (targetIndex === -1) return allMessages;

            const updatedMessages = [...roomMsgs];
            updatedMessages[targetIndex] = {
              ...updatedMessages[targetIndex],
              reactions: reactions || []
            };

            return {
              ...allMessages,
              [targetRoomId]: updatedMessages
            };
          });
        },
        error: (err) => console.error('Socket reaction update error:', err)
      });

    // 3. حذف روم‌ها "برای من" -- سرور: room.deleted.me => { roomIds: string[] }
    this.socketService.listen<{ roomIds: string[] }>('room.deleted.me')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          (payload?.roomIds || []).forEach(roomId => this.handleLocalRoomRemove(String(roomId)));
        },
        error: (err) => console.error('Socket room.deleted.me error:', err)
      });

    // 4. حذف دایرکت برای هر دو طرف -- سرور: direct.deleted.mutual => { roomId }
    this.socketService.listen<{ roomId: string }>('direct.deleted.mutual')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          if (payload?.roomId) this.handleLocalRoomRemove(String(payload.roomId));
        },
        error: (err) => console.error('Socket direct.deleted.mutual error:', err)
      });

    // 5. ترک دائمی گروه/کانال -- سرور: room.left.permanent => { roomIds, type }
    this.socketService.listen<{ roomIds: string[]; type: RoomKind }>('room.left.permanent')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          (payload?.roomIds || []).forEach(roomId => this.handleLocalRoomRemove(String(roomId)));
        },
        error: (err) => console.error('Socket room.left.permanent error:', err)
      });

    // 6. حذف/دراپ کل گروه یا کانال -- سرور: room.destroyed => { roomId, type }
    this.socketService.listen<{ roomId: string; type: RoomKind }>('room.destroyed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          if (payload?.roomId) this.handleLocalRoomRemove(String(payload.roomId));
        },
        error: (err) => console.error('Socket room.destroyed error:', err)
      });

    // 7. بیرون انداختن کاربر از روم (مثلاً بعد از بلاک شدن) -- room.kicked => { roomId, reason }
    this.socketService.listen<{ roomId: string; reason?: string }>('room.kicked')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          if (payload?.roomId) this.handleLocalRoomRemove(String(payload.roomId));
        },
        error: (err) => console.error('Socket room.kicked error:', err)
      });

    // 8. حذف پیام‌ها برای همه -- message.deleted => { roomId, messageIds }
    this.socketService.listen<{ roomId: string; messageIds: string[] }>('message.deleted')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          const roomId = payload?.roomId ? String(payload.roomId) : null;
          if (!roomId || !payload.messageIds?.length) return;

          this.messages.update(all => {
            const roomMsgs = all[roomId];
            if (!roomMsgs) return all;

            const ids = new Set(payload.messageIds.map(id => String(id)));
            const filtered = roomMsgs.filter(m => !ids.has(String(m._id || m.id)));

            return { ...all, [roomId]: filtered };
          });
        },
        error: (err) => console.error('Socket message.deleted error:', err)
      });

    // 9. حذف پیام‌ها "برای من" -- message.hidden => { messageIds }
    this.socketService.listen<{ messageIds: string[] }>('message.hidden')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload) => {
          if (!payload?.messageIds?.length) return;

          const ids = new Set(payload.messageIds.map(id => String(id)));

          this.messages.update(all => {
            const next: Record<string | number, Message[]> = {};

            Object.entries(all).forEach(([roomId, roomMsgs]) => {
              next[roomId] = roomMsgs.filter(m => !ids.has(String(m._id || m.id)));
            });

            return next;
          });
        },
        error: (err) => console.error('Socket message.hidden error:', err)
      });
  }

  /**
   * پاکسازی لوکال پیام‌های یک روم در استیت فرانت‌اند
   */
  private handleLocalHistoryClear(roomId: string) {
    this.messages.update(all => ({
      ...all,
      [roomId]: []
    }));

    this.conversations.update(chats =>
      chats.map(c =>
        String(c.id) === String(roomId)
          ? { ...c, lastMessage: '', lastMessageData: null, unreadCount: 0 }
          : c
      )
    );

    if (String(this.activeConversationId()) === String(roomId)) {
      this.replyingToMessage.set(null);
    }
  }

  /**
   * حذف لوکال یک روم از لیست مکالمات و بستن صفحه چت در صورت فعال بودن
   */
  private handleLocalRoomRemove(roomId: string) {
    this.conversations.update(chats => chats.filter(c => String(c.id) !== String(roomId)));

    this.messages.update(all => {
      const copy = { ...all };
      delete copy[roomId];
      return copy;
    });

    if (String(this.activeConversationId()) === String(roomId)) {
      this.activeConversationId.set(null);
      this.replyingToMessage.set(null);
      this.router.navigate(['/chat']);
    }
  }

  // ==================== متدهای Pin / Unpin / Archive / Unread (منطبق با ChatController) ====================

  /**
   * منطبق با @Post(':roomId/pin') در ChatController
   */
  pinRoom(roomId: string | number) {
    const id = String(roomId);
    const now = new Date().toISOString();

    this.conversations.update(chats =>
      chats.map(c => String(c.id) === id ? { ...c, pinned: true, pinnedAt: now } : c)
    );

    this.http.post<any>(`${this.API_URL}/chat/${id}/pin`, {}).pipe(
      tap((res) => {
        const serverPinnedAt = res?.data?.pinnedAt;
        if (serverPinnedAt !== undefined) {
          this.conversations.update(chats =>
            chats.map(c => String(c.id) === id ? { ...c, pinned: Boolean(serverPinnedAt), pinnedAt: serverPinnedAt } : c)
          );
        }
      }),
      catchError(err => {
        console.error('Error pinning room:', err);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * منطبق با @Post(':roomId/pin') در ChatController (چون بک‌اند Toggle می‌کند)
   */
  unpinRoom(roomId: string | number) {
    const id = String(roomId);

    this.conversations.update(chats =>
      chats.map(c => String(c.id) === id ? { ...c, pinned: false, pinnedAt: null } : c)
    );

    this.http.post<any>(`${this.API_URL}/chat/${id}/pin`, {}).pipe(
      catchError(err => {
        console.error('Error unpinning room:', err);
        return of(null);
      })
    ).subscribe();
  }

  markAsUnread(roomId: string | number) {
    const id = String(roomId);
    this.conversations.update(chats =>
      chats.map(c => String(c.id) === id ? { ...c, unreadCount: Math.max(c.unreadCount || 0, 1) } : c)
    );
  }

  /**
   * منطبق با @Patch(':roomId/archive') در ChatController
   */
  archiveRoom(roomId: string | number) {
    const id = String(roomId);

    this.conversations.update(chats =>
      chats.map(c => String(c.id) === id ? { ...c, archived: true, isArchived: true } as any : c)
    );

    if (String(this.activeConversationId()) === id) {
      this.activeConversationId.set(null);
      this.replyingToMessage.set(null);
      this.router.navigate(['/chat']);
    }

    this.http.patch<any>(`${this.API_URL}/chat/${id}/archive`, {}).pipe(
      catchError(err => {
        console.error('Error archiving room:', err);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * منطبق با @Patch(':roomId/unarchive') در ChatController
   */
  unarchiveRoom(roomId: string | number) {
    const id = String(roomId);

    this.conversations.update(chats =>
      chats.map(c => String(c.id) === id ? { ...c, archived: false, isArchived: false } as any : c)
    );

    this.http.patch<any>(`${this.API_URL}/chat/${id}/unarchive`, {}).pipe(
      catchError(err => {
        console.error('Error unarchiving room:', err);
        return of(null);
      })
    ).subscribe();
  }

  clearHistory(roomId: string | number, type: string = 'DM', alsoForOther: boolean = false) {
    const id = String(roomId);

    const emitClear = (messageIds: string[]) => {
      if (messageIds.length === 0) return;

      this.socketService.emit(
        alsoForOther ? 'message.delete.everyone' : 'message.delete.me',
        { messageIds }
      );
    };

    const loadedIds = (this.messages()[id] || [])
      .map(m => String(m._id || m.id))
      .filter(mid => !!mid && !mid.startsWith('temp_'));

    if (loadedIds.length > 0) {
      emitClear(loadedIds);
    } else {
      // اگر پیام‌های این روم در استیت نیستند، اول از سرور بگیر و بعد حذف کن
      this.http.get<BackendMessagesResponse>(`${this.API_URL}/chat/${id}/messages`).subscribe({
        next: (res) => {
          const fetchedIds = (res?.messages || [])
            .map(m => String(m._id || (m as any).id))
            .filter(Boolean);

          emitClear(fetchedIds);
        },
        error: (err) => console.error(`clearHistory: failed to load messages for room ${id}`, err)
      });
    }

    // به‌روزرسانی خوش‌بینانه‌ی UI
    this.handleLocalHistoryClear(id);
  }

  /**
   * حذف چت دایرکت.
   *   - alsoForOther = true  -> direct.delete.mutual => { roomId }   (برای هر دو طرف)
   *   - alsoForOther = false -> room.delete.me      => { roomIds }   (فقط برای من)
   */
  deleteDirectRoom(roomId: string | number, alsoForOther: boolean = false) {
    const id = String(roomId);

    if (alsoForOther) {
      this.socketService.emit('direct.delete.mutual', { roomId: id });
    } else {
      this.socketService.emit('room.delete.me', { roomIds: [id] });
    }

    // خروج از اتاق سوکت تا پیام جدیدی دریافت نشود
    this.socketService.emit('room.leave', { roomId: id });

    this.handleLocalRoomRemove(id);
  }

  /**
   * ترک دائمی گروه -> room.leave.permanent => { roomIds, type: 'GROUP' }
   */
  leaveGroup(roomId: string | number) {
    const id = String(roomId);
    this.socketService.emit('room.leave.permanent', { roomIds: [id], type: 'GROUP' });
    this.socketService.emit('room.leave', { roomId: id });
    this.handleLocalRoomRemove(id);
  }

  /**
   * حذف (دراپ) کل گروه -> room.destroy => { roomId, type: 'GROUP' }
   */
  deleteGroup(roomId: string | number) {
    const id = String(roomId);
    this.socketService.emit('room.destroy', { roomId: id, type: 'GROUP' });
    this.handleLocalRoomRemove(id);
  }

  /**
   * ترک دائمی کانال -> room.leave.permanent => { roomIds, type: 'CHANNEL' }
   */
  leaveChannel(roomId: string | number) {
    const id = String(roomId);
    this.socketService.emit('room.leave.permanent', { roomIds: [id], type: 'CHANNEL' });
    this.socketService.emit('room.leave', { roomId: id });
    this.handleLocalRoomRemove(id);
  }

  /**
   * حذف (دراپ) کل کانال -> room.destroy => { roomId, type: 'CHANNEL' }
   */
  deleteChannel(roomId: string | number) {
    const id = String(roomId);
    this.socketService.emit('room.destroy', { roomId: id, type: 'CHANNEL' });
    this.handleLocalRoomRemove(id);
  }

  // =========================================================================

  loadConversations() {
    this.http.get<any>(`${this.API_URL}/chat/user-rooms`)
      .pipe(
        map(response => response?.data || []),
        switchMap((rooms: any[]) => {
          if (!Array.isArray(rooms) || rooms.length === 0) {
            return of({ rooms: [], statusMap: {} as Record<string, boolean> });
          }

          const userIds = rooms
            .filter(r => r.type === 'DM')
            .map(r => r.targetUserId || r.otherUser?._id || r.otherUser?.id)
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
          return rooms.map((room: any): Conversation => {
            const rawTargetId = room.targetUserId || room.otherUser?._id || room.otherUser?.id;
            const targetUserId: string | null = rawTargetId ? String(rawTargetId) : null;
            const isOnline = targetUserId ? (statusMap[targetUserId] ?? false) : false;

            let displayName = room.name;
            if (room.type === 'DM' && room.otherUser) {
              displayName = `${room.otherUser.firstName || ''} ${room.otherUser.lastName || ''}`.trim() || room.otherUser.username || room.name;
            } else if (!displayName) {
              displayName = 'No named chat';
            }

            const lastMsg = room.lastMessage;
            const lastMessageText = lastMsg?.content || '';
            const lastMessageTime = lastMsg?.createdAt || room.joinedAt || '';

            return {
              id: room.id || room._id,
              name: displayName,
              avatar: room.otherUser?.photoUrl || room.avatar,
              type: room.type,
              lastMessage: lastMessageText,
              lastMessageTime: lastMessageTime,
              lastMessageData: lastMsg || null,
              unreadCount: room.unreadCount || 0,
              isOnline,
              bio: room.otherUser?.bio,
              phoneNumber: room.otherUser?.phoneNumber,
              mutedUntil: room.mutedUntil ?? null,
              pinnedAt: room.pinnedAt ?? null,
              pinned: Boolean(room.pinned || room.pinnedAt || room.isPinned),
              archived: Boolean(room.archived || room.isArchived || room.archivedAt),
              targetUserId,
              role: room.role,
              joinedAt: room.joinedAt,
              otherUser: room.otherUser || null
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
          return msgs.map(m => {
            const serverId = String(m._id || (m as any).id);
            return {
              id: serverId,
              _id: serverId,
              conversationId: String(m.roomId),
              roomId: String(m.roomId),
              senderId: String(m.senderId),
              sender: (m as any).sender || null,
              content: m.content,
              time: m.createdAt,
              createdAt: m.createdAt,
              isSender: String(m.senderId) === String(currentUserId),
              status: m.isRead ? 'read' : 'sent',
              replyTo: this.normalizeReply((m as any).replyTo),
              reactions: (m as any).reactions || [],
              media: (m as any).media || [],
              isForwarded: (m as any).isForwarded || false,
              forwardedFromUser: (m as any).forwardedFromUser || null,
              forwardedFromRoom: (m as any).forwardedFromRoom || null,
              isEdited: (m as any).isEdited || false
            } as Message;
          });
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

  sendForwardedMessage(roomId: string, message: string, media: any, originalMsgId: string, forwardedFromUser: string) {
    const payload = {
      roomId: roomId,
      message: message,
      media: media,
      isForwarded: true,
      forwardedFromUser: forwardedFromUser,
      forwardedFromRoom: originalMsgId
    };

    this.socketService.emit('room.message', payload);
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
      payload.replyTo = String(currentReply._id || currentReply.id);
    }

    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId: String(activeId),
      roomId: String(activeId),
      content: trimmedText,
      time: nowIso,
      createdAt: nowIso,
      isSender: true,
      status: 'sending',
      replyTo: currentReply ? {
        id: currentReply._id || currentReply.id,
        _id: currentReply._id || currentReply.id,
        content: currentReply.content,
        sender: currentReply.sender,
        senderName: currentReply.isSender ? 'شما' : undefined,
        media: currentReply.media
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

  /**
   * منطبق با @Put('room-mute') در ChatController
   */
  muteRoom(roomId: string | number, durationMinutes: number) {
    const optimisticDate = durationMinutes > 0
      ? new Date(Date.now() + durationMinutes * 60000).toISOString()
      : null;

    this.conversations.update(chats =>
      chats.map(chat =>
        String(chat.id) === String(roomId)
          ? { ...chat, mutedUntil: optimisticDate }
          : chat
      )
    );

    return this.http.put<RoomMuteResponse>(`${this.API_URL}/chat/room-mute`, {
      roomId: String(roomId),
      durationMinutes
    }).pipe(
      tap((res) => {
        if (res?.data && 'muted' in res.data) {
          this.conversations.update(chats =>
            chats.map(chat =>
              String(chat.id) === String(roomId)
                ? { ...chat, mutedUntil: res.data.muted ?? null }
                : chat
            )
          );
        }
      }),
      catchError(err => {
        console.warn('Mute API error:', err);
        return of(null);
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
