import { Injectable, signal, computed } from '@angular/core';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  readonly conversations = signal<Conversation[]>([
    {
      id: '1',
      name: 'Technical Support',
      avatar: '',
      lastMessage: 'Hello, your ticket has been reviewed.',
      lastMessageTime: '12:30 PM',
      unreadCount: 2,
      isOnline: true
    },
    {
      id: '2',
      name: 'Frontend Team',
      avatar: '',
      lastMessage: 'Components have been merged.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      isOnline: false
    }
  ]);

  readonly activeConversationId = signal<string | number | null>('1');

  readonly messages = signal<Record<string | number, Message[]>>({
    '1': [
      { id: 1, conversationId: '1', text: 'Hi, what is the status of my payment?', time: '12:25 PM', isSender: true, status: 'read' },
      { id: 2, conversationId: '1', text: 'Hello, your ticket has been reviewed and approved.', time: '12:30 PM', isSender: false }
    ]
  });

  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    return this.conversations().find(c => c.id === id) ?? null;
  });

  readonly currentMessages = computed(() => {
    const id = this.activeConversationId();
    if (!id) return [];
    return this.messages()[id] || [];
  });

  setActiveConversation(id: string | number) {
    this.activeConversationId.set(id);
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
