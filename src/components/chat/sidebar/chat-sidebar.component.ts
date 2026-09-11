import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
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
  lucideCheckCircle2
} from '@ng-icons/lucide';

// Spartan UI New Imports
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

import { AccountSettingsComponent } from '../modals/account-dialog.component';
import { SettingsDialogComponent } from '../modals/setting-dialog.component';
import { CreateChannelDialogComponent } from '../modals/channel-dialog.component';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmInputImports,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmDialogImports,
    AccountSettingsComponent,
    SettingsDialogComponent,
    CreateChannelDialogComponent
  ],
  providers: [
    provideIcons({
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
      lucideCheckCircle2
    })
  ],
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
