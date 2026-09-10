import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideSearch,
  lucidePlus,
  lucideCheckCheck,
  lucideArrowLeft,
  lucideSun,
  lucidePencil,
  lucideUser,
  lucideBookmark,
  lucideSettings,
  lucideUsers,
  lucideTv,
  lucideHeadphones,
  lucideHelpCircle,
  lucideInfo,
  lucideCheckCircle2
} from '@ng-icons/lucide';

// Spartan UI New Imports
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmInputImports,
    HlmAvatarImports,
    HlmBadgeImports
  ],
  providers: [provideIcons({
    lucideSearch, lucidePlus, lucideCheckCheck,
    lucideArrowLeft,
    lucideSun,
    lucidePencil,
    lucideUser,
    lucideBookmark,
    lucideSettings,
    lucideUsers,
    lucideTv,
    lucideHeadphones,
    lucideHelpCircle,
    lucideInfo,
    lucideCheckCircle2
  })],
  templateUrl: './chat-sidebar.component.html'
})
export class ChatSidebarComponent {
  readonly chatService = inject(ChatService);

  currentView = signal<'chats' | 'profile'>('chats');

  openProfile(): void {
    this.currentView.set('profile');
  }

  backToChats(): void {
    this.currentView.set('chats');
  }

  onMenuItemClick(action: string): void {
    console.log('Action clicked:', action);
  }
}
