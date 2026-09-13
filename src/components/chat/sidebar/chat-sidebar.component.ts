import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucidePlus,
  lucideCheckCheck,
  lucideArrowLeft,
  lucideArrowRight,
  lucideSun,
  lucidePencil,
  lucideUser,
  lucideBookmark,
  lucideSettings,
  lucideUsers,
  lucideTv,
  lucideHeadphones,
  lucideHelpCircle,
  lucideCheckCircle2,
  lucideX,
  lucideChevronDown,
  lucideClock,
  lucideTrash2,
  lucideBadgeCheck,
  lucideBot,
  lucidePhone,
  lucideMoon,
  lucideSparkles,
  lucideBug,
  lucideLogOut,
  lucidePinOff,
  lucideFolderPlus,
  lucideMessageSquareDot,
  lucideBellOff,
  lucideArchive,
  lucideCheckSquare
} from '@ng-icons/lucide';

// Spartan UI Imports
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

import { AccountSettingsComponent } from '../modals/account-dialog.component';
import { SettingsDialogComponent } from '../modals/setting-dialog.component';
import { CreateChannelDialogComponent } from '../modals/channel-dialog.component';
import { CreateGroupDialogComponent } from '../modals/group-dialog.component';
import { RecentContact, SearchResultItem } from '../../../models/conversation.model';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

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
    CreateChannelDialogComponent,
    CreateGroupDialogComponent,
    HlmContextMenuImports,
    HlmDropdownMenuImports
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucidePlus,
      lucideCheckCheck,
      lucideArrowLeft,
      lucideArrowRight,
      lucideSun,
      lucidePencil,
      lucideUser,
      lucideBookmark,
      lucideSettings,
      lucideUsers,
      lucideTv,
      lucideHeadphones,
      lucideHelpCircle,
      lucideCheckCircle2,
      lucideX,
      lucideChevronDown,
      lucideClock,
      lucideTrash2,
      lucideBadgeCheck,
      lucidePinOff,
      lucideFolderPlus,
      lucideMessageSquareDot,
      lucideBellOff,
      lucideArchive,
      lucideCheckSquare
    })
  ],
  templateUrl: './chat-sidebar.component.html'
})
export class ChatSidebarComponent {
  readonly chatService = inject(ChatService);

  currentView = signal<'chats' | 'profile' | 'search'>('chats');
  searchQuery = signal<string>('');
  selectedTab = signal<'all' | 'channel' | 'bot' | 'service'>('all');
  activeMenuChat = signal<any>(null);

  recentContacts = signal<RecentContact[]>([
    { id: '1', name: 'John', fallbackText: 'J', fallbackBg: 'bg-red-500' },
    { id: '2', name: 'Kevin', fallbackText: 'K', fallbackBg: 'bg-red-500' },
    { id: '3', name: 'Nia', fallbackText: 'N', fallbackBg: 'bg-red-500' },
    { id: '4', name: 'Arman', fallbackText: 'A', fallbackBg: 'bg-red-500' }
  ]);

  recentSearches = signal<RecentContact[]>([
    { id: 'rec-1', name: 'Mom', fallbackText: 'M', fallbackBg: 'bg-red-500' },
    { id: 'rec-2', name: 'Dad', fallbackText: 'D', fallbackBg: 'bg-red-500' }
  ]);

  allSearchItems = signal<SearchResultItem[]>([
    {
      id: '101',
      name: 'ADLIRAN',
      subInfo: '9.6M monthly users',
      fallbackText: 'AD',
      fallbackBg: 'bg-white text-zinc-900',
      type: 'service',
      verified: true,
      actionText: 'Open'
    },
    {
      id: '102',
      name: 'Spartan Team',
      subInfo: '44 members',
      fallbackText: 'SA',
      fallbackBg: 'bg-zinc-700',
      type: 'channel'
    },
    {
      id: '103',
      name: 'Deleted Account',
      fallbackText: 'D',
      fallbackBg: 'bg-amber-500',
      type: 'chat'
    },
    {
      id: '104',
      name: 'Mahdi Pakbaz',
      username: '@spartan',
      fallbackText: 'MP',
      fallbackBg: 'bg-zinc-700',
      type: 'bot'
    }
  ]);


  filteredResults = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const tab = this.selectedTab();

    let items = this.allSearchItems();

    if (tab !== 'all') {
      items = items.filter(item => item.type === tab);
    }

    if (!q) return items;

    return items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.username && item.username.toLowerCase().includes(q))
    );
  });

  openSearch(): void {
    this.currentView.set('search');
  }

  closeSearch(): void {
    this.searchQuery.set('');
    this.currentView.set('chats');
  }

  openProfile(): void {
    this.currentView.set('profile');
  }

  backToChats(): void {
    this.currentView.set('chats');
  }

  clearSearchQuery(): void {
    this.searchQuery.set('');
  }

  clearRecentSearches(): void {
    this.recentSearches.set([]);
  }

  onSelectResult(item: SearchResultItem | RecentContact): void {
    if ('id' in item) {
      this.chatService.setActiveConversation(item.id);
    }
  }

  onMenuItemClick(action: string): void {
    console.log('Action clicked:', action);
  }

  handleAction(action: string) {
    console.log(`Action: ${action} for:`, this.activeMenuChat()?.name);
  }
}
