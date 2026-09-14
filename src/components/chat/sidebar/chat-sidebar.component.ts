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
import { ThemeService } from '../../../services/theme/theme.service';
import { Router } from '@angular/router';
import { AddContactDialogComponent, NewContactData } from '../modals/add-contact-dialog.component';

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
    HlmDropdownMenuImports,
    AddContactDialogComponent
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
      lucideCheckSquare,
      lucideMoon
    })
  ],
  templateUrl: './chat-sidebar.component.html'
})
export class ChatSidebarComponent {
  readonly chatService = inject(ChatService);
  readonly themeService = inject(ThemeService)
  readonly router = inject(Router)

  currentView = signal<'chats' | 'search' | 'profile' | 'contacts'>('chats');
  searchQuery = signal<string>('');
  selectedTab = signal<'all' | 'channel' | 'bot' | 'service'>('all');
  activeMenuChat = signal<any>(null);
  contactsSearchQuery = signal<string>('');

  recentContacts = signal<RecentContact[]>([
    { id: '1', name: 'John', fallbackText: 'J', fallbackBg: 'bg-emerald-500' },
    { id: '2', name: 'Kevin', fallbackText: 'K', fallbackBg: 'bg-emerald-500' },
    { id: '3', name: 'Nia', fallbackText: 'N', fallbackBg: 'bg-emerald-500' },
    { id: '4', name: 'Arman', fallbackText: 'A', fallbackBg: 'bg-emerald-500' }
  ]);

  recentSearches = signal<RecentContact[]>([
    { id: 'rec-1', name: 'Mom', fallbackText: 'M', fallbackBg: 'bg-emerald-500' },
    { id: 'rec-2', name: 'Dad', fallbackText: 'D', fallbackBg: 'bg-emerald-500' }
  ]);

  contacts = signal([
    { id: '1', name: 'Ali Rezaei', phone: '+98 912 111 2233', online: true, lastSeen: 'online' },
    { id: '2', name: 'Amirhossein', phone: '+98 935 222 4455', online: false, lastSeen: 'last seen 2 hours ago' },
    { id: '3', name: 'Daniel Smith', phone: '+1 415 555 0199', online: true, lastSeen: 'online' },
    { id: '4', name: 'Ehsan Mohammadi', phone: '+98 912 888 9900', online: false, lastSeen: 'last seen yesterday' },
    { id: '5', name: 'Sara Tehrani', phone: '+98 912 777 6655', online: true, lastSeen: 'online' },
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

  groupedContacts = computed(() => {
    const query = this.contactsSearchQuery().toLowerCase().trim();
    const filtered = this.contacts().filter(c =>
      c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))
    );

    const groups: { [key: string]: typeof filtered } = {};
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    for (const contact of sorted) {
      const letter = (contact.name[0] || '#').toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
    }

    return Object.keys(groups).map(letter => ({ letter, contacts: groups[letter] }));
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

  redirectSupport() {
    this.router.navigate(['/support']);
  }

  openContacts() {
    this.currentView.set('contacts');
  }

  onSelectContact(contact: any) {
    this.currentView.set('chats');
  }

  onAddContact() {
    console.log('Add contact triggered');
  }

  onNewContactAdded(newContact: NewContactData): void {
    const fullName = `${newContact.firstName} ${newContact.lastName}`.trim();

    const contactItem = {
      id: crypto.randomUUID(),
      name: fullName,
      phone: newContact.phoneOrUsername,
      online: false,
      lastSeen: 'just now'
    };

    this.contacts.update(list => [contactItem, ...list]);
  }

}
