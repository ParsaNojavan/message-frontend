import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportChatMessage, SupportVisitorRoom } from '../../models/support.model';

// Spartan NG Imports
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmAlertImports } from '@spartan-ng/helm/alert';

// Lucide Icons
import { NgIcon, NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideKey,
  lucideCopy,
  lucideCheck,
  lucideMessageSquare,
  lucideSend,
  lucideSearch,
  lucideGlobe,
  lucideCode2,
  lucideSparkles,
  lucideAlertTriangle,
  lucideShieldCheck,
  lucideArrowLeft
} from '@ng-icons/lucide';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-support-service',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    HlmBadgeImports,
    HlmFieldImports,
    HlmInputImports,
    HlmDialogImports,
    HlmAlertImports,
    HlmAvatarImports,
    HlmButtonImports
  ],
  providers: [
    provideIcons({ lucideKey, lucideSparkles, lucideCopy, lucideCheck, lucideAlertTriangle, lucideMessageSquare, lucideCode2, lucideSearch, lucideGlobe, lucideSend, lucideArrowLeft })
  ],
  templateUrl: './support-service.component.html'
})
export class SupportServiceComponent {

  readonly router = inject(Router)

  readonly isMobileChatOpen = signal(false);

  // Key lifecycle states
  hasKeyConfigured = signal<boolean>(false);
  generatedKey = signal<string | null>(null);
  isGeneratingKey = signal<boolean>(false);

  // UI state
  copiedKey = signal<boolean>(false);
  copiedSnippet = signal<boolean>(false);
  isEmbedDialogOpen = signal<boolean>(false);

  searchQuery = signal<string>('');
  activeRoomId = signal<string | null>('room-1');
  replyText = signal<string>('');

  // Sample Visitor Rooms
  rooms = signal<SupportVisitorRoom[]>([
    {
      id: 'room-1',
      visitorId: 'vis_8821',
      visitorName: 'Visitor #8821',
      visitorIp: '185.192.44.12',
      visitorLocation: 'London, UK',
      currentPage: '/pricing',
      isOnline: true,
      unreadCount: 2,
      lastMessage: 'Hi! Does the enterprise tier include 24/7 dedicated support?',
      updatedAt: new Date(Date.now() - 3 * 60 * 1000),
      messages: [
        { id: 'm1', sender: 'visitor', text: 'Hello there!', timestamp: new Date(Date.now() - 8 * 60 * 1000) },
        { id: 'm2', sender: 'visitor', text: 'Hi! Does the enterprise tier include 24/7 dedicated support?', timestamp: new Date(Date.now() - 3 * 60 * 1000) }
      ]
    },
    {
      id: 'room-2',
      visitorId: 'vis_4019',
      visitorName: 'Alex Rivera',
      visitorIp: '104.28.19.88',
      visitorLocation: 'San Francisco, US',
      currentPage: '/checkout',
      isOnline: true,
      unreadCount: 0,
      lastMessage: 'Payment went through successfully, thanks for your help!',
      updatedAt: new Date(Date.now() - 25 * 60 * 1000),
      messages: [
        { id: 'm1', sender: 'visitor', text: 'Getting a gateway timeout error during checkout.', timestamp: new Date(Date.now() - 35 * 60 * 1000) },
        { id: 'm2', sender: 'agent', text: 'Please try again now, our payment service is restored.', timestamp: new Date(Date.now() - 30 * 60 * 1000) },
        { id: 'm3', sender: 'visitor', text: 'Payment went through successfully, thanks for your help!', timestamp: new Date(Date.now() - 25 * 60 * 1000) }
      ]
    },
    {
      id: 'room-3',
      visitorId: 'vis_1102',
      visitorName: 'Visitor #1102',
      visitorIp: '89.165.2.11',
      visitorLocation: 'Frankfurt, DE',
      currentPage: '/docs/api',
      isOnline: false,
      unreadCount: 0,
      lastMessage: 'How do I configure custom webhook payloads?',
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000),
      messages: [
        { id: 'm1', sender: 'visitor', text: 'How do I configure custom webhook payloads?', timestamp: new Date(Date.now() - 2 * 3600 * 1000) }
      ]
    }
  ]);

  // Computed Properties
  filteredRooms = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.rooms();
    return this.rooms().filter(r =>
      r.visitorName.toLowerCase().includes(q) ||
      r.lastMessage.toLowerCase().includes(q) ||
      (r.currentPage && r.currentPage.toLowerCase().includes(q))
    );
  });

  activeRoom = computed(() => {
    const id = this.activeRoomId();
    return this.rooms().find(r => r.id === id) || null;
  });

  embedCodeSnippet = computed(() => {
    return `<script src="https://widget.yourapp.com/loader.js" data-chat-key="YOUR_SAVED_API_KEY" async><\/script>`;
  });

  // Generate API key automatically via User Auth Session
  generateApiKey(): void {
    this.isGeneratingKey.set(true);
    setTimeout(() => {
      const generated = 'live_pk_' + Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map(b => b.toString(36).padStart(2, '0'))
        .join('')
        .slice(0, 24);
      this.generatedKey.set(generated);
      this.isGeneratingKey.set(false);
    }, 600);
  }

  // Finalize onboarding: hide plain key forever and unlock dashboard
  confirmAndProceed(): void {
    this.hasKeyConfigured.set(true);
    this.generatedKey.set(null); // Key is immediately purged from active memory display
  }

  copyApiKey(): void {
    const key = this.generatedKey();
    if (!key) return;
    navigator.clipboard.writeText(key);
    this.copiedKey.set(true);
    setTimeout(() => this.copiedKey.set(false), 2000);
  }

  copySnippet(): void {
    navigator.clipboard.writeText(this.embedCodeSnippet());
    this.copiedSnippet.set(true);
    setTimeout(() => this.copiedSnippet.set(false), 2000);
  }

  selectRoom(roomId: string): void {
    this.activeRoomId.set(roomId);
    this.isMobileChatOpen.set(true);

    this.rooms.update(list =>
      list.map(room =>
        room.id === roomId
          ? { ...room, unreadCount: 0 }
          : room
      )
    );
  }

  sendMessage(): void {
    const text = this.replyText().trim();
    const roomId = this.activeRoomId();
    if (!text || !roomId) return;

    const newMsg: SupportChatMessage = {
      id: Date.now().toString(),
      sender: 'agent',
      text,
      timestamp: new Date()
    };

    this.rooms.update(list => list.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          lastMessage: text,
          updatedAt: new Date(),
          messages: [...r.messages, newMsg]
        };
      }
      return r;
    }));

    this.replyText.set('');
  }

  redirectHome() {
    this.router.navigate(['/chat'])
  }

  backToRooms(): void {
    this.isMobileChatOpen.set(false);
  }
}
