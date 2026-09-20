import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChatService } from '../../../services/chat/chat.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { ContactsService } from '../../../services/chat/contacts.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucidePlus,
  lucideCheckCheck,
  lucideArrowLeft,
  lucideArrowRight,
  lucideSun,
  lucideMoon,
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
  lucideSparkles,
  lucideBug,
  lucideLogOut,
  lucidePinOff,
  lucideFolderPlus,
  lucideMessageSquareDot,
  lucideBellOff,
  lucideArchive,
  lucideCheckSquare,
  lucideMessageSquare,
  lucideUserPlus
} from '@ng-icons/lucide';

// Spartan UI Imports
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

// Modal Dialogs & Models
import { AccountSettingsComponent } from '../modals/account-dialog.component';
import { SettingsDialogComponent } from '../modals/setting-dialog.component';
import { CreateChannelDialogComponent } from '../modals/channel-dialog.component';
import { CreateGroupDialogComponent } from '../modals/group-dialog.component';
import { AddContactDialogComponent, NewContactData } from '../modals/add-contact-dialog.component';
import { ConversationFilter, RecentContact, SearchResultItem } from '../../../models/conversation.model';
import { Contact } from '../../../models/contact.model';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIconComponent,
    HlmInputImports,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmDialogImports,
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    AccountSettingsComponent,
    SettingsDialogComponent,
    CreateChannelDialogComponent,
    CreateGroupDialogComponent,
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
      lucideMoon,
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
      lucideSparkles,
      lucideBug,
      lucideLogOut,
      lucidePinOff,
      lucideFolderPlus,
      lucideMessageSquareDot,
      lucideBellOff,
      lucideArchive,
      lucideCheckSquare,
      lucideMessageSquare,
      lucideUserPlus
    })
  ],
  templateUrl: './chat-sidebar.component.html'
})
export class ChatSidebarComponent implements OnInit {
  readonly chatService = inject(ChatService);
  readonly themeService = inject(ThemeService);
  readonly contactsService = inject(ContactsService);
  readonly router = inject(Router);

  currentView = signal<'chats' | 'search' | 'profile' | 'contacts'>('chats');
  searchQuery = signal<string>('');
  selectedTab = signal<'all' | 'group' | 'channel' | 'dm'>('all');
  activeMenuChat = signal<any>(null);
  contactsSearchQuery = signal<string>('');
  selectedChatFilter = signal<ConversationFilter>('ALL');

  contacts = this.contactsService.contacts;

  recentContacts = computed(() => {
    return this.contacts().slice(0, 8);
  });

  recentSearches = signal<RecentContact[]>([
    { id: 'rec-1', name: 'Saved Messages', fallbackText: 'SM', fallbackBg: 'bg-emerald-500' }
  ]);

  allSearchItems = signal<SearchResultItem[]>([]);

  ngOnInit(): void {
    this.contactsService.getContacts().subscribe({
      error: (err) => console.error('Failed to load contacts:', err)
    });
  }

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

  filteredConversations = computed(() => {
    const filter = this.selectedChatFilter();
    const query = this.searchQuery().trim().toLowerCase();
    const conversations = this.chatService.conversations() || [];

    return conversations.filter(chat => {
      const matchesType = filter === 'ALL' || chat.type?.toUpperCase() === filter;
      const matchesSearch =
        !query ||
        chat.name.toLowerCase().includes(query) ||
        (chat.lastMessage?.toLowerCase().includes(query) ?? false);
      return matchesType && matchesSearch;
    });
  });

  chatCounts = computed(() => {
    const list = this.chatService.conversations() || [];
    return {
      all: list.length,
      dm: list.filter(c => c.type?.toUpperCase() === 'DM').length,
      group: list.filter(c => c.type?.toUpperCase() === 'GROUP').length,
      channel: list.filter(c => c.type?.toUpperCase() === 'CHANNEL').length
    };
  });

  getContactFullName(contact: Contact): string {
    const first = contact.customFirstName || contact.contactUser?.firstName || '';
    const last = contact.customLastName || contact.contactUser?.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown';
  }

  getContactInitials(contact: Contact): string {
    const first = contact.customFirstName || contact.contactUser?.firstName || '';
    const last = contact.customLastName || contact.contactUser?.lastName || '';
    
    if (first || last) {
      const f = first ? first.charAt(0).toUpperCase() : '';
      const l = last ? last.charAt(0).toUpperCase() : '';
      return `${f}${l}` || '?';
    }
    return '?';
  }

  groupedContacts = computed(() => {
    const query = this.contactsSearchQuery().toLowerCase().trim();
    
    const filtered = this.contacts().filter((c: Contact) => {
      const fullName = this.getContactFullName(c).toLowerCase();
      const phoneMatch = (c.contactUser?.phoneNumber || '').includes(query);
      return fullName.includes(query) || phoneMatch;
    });

    const groups: { [key: string]: Contact[] } = {};
    const sorted = [...filtered].sort((a: Contact, b: Contact) =>
      this.getContactFullName(a).localeCompare(this.getContactFullName(b))
    );

    for (const contact of sorted) {
      const name = this.getContactFullName(contact);
      const letter = (name[0] || '#').toUpperCase();
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

  openContacts(): void {
    this.currentView.set('contacts');
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

  setFilter(filter: ConversationFilter): void {
    this.selectedChatFilter.set(filter);
  }

  onSelectResult(item: SearchResultItem | RecentContact): void {
    if ('id' in item) {
      this.router.navigate(['/chat'], { queryParams: { id: item.id } });
      this.closeSearch();
    }
  }

  onSelectContact(contact: Contact): void {
    const targetId = contact.contactUser._id;
    this.router.navigate(['/chat'], { queryParams: { id: targetId } });
    this.backToChats();
  }

  handleAction(action: string): void {
    console.log(`Action: ${action} for chat:`, this.activeMenuChat()?.name);
  }

  redirectSupport(): void {
    this.router.navigate(['/support']);
  }

  getInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return '?';
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}`;
  }

  onNewContactAdded(newContact: NewContactData): void {
    this.contactsService.addContact({
      query: newContact.phoneOrUsername,
      customFirstName: newContact.firstName,
      customLastName: newContact.lastName
    }).subscribe({
      next: (created) => {
        console.log('Contact added successfully:', created);
      },
      error: (err) => {
        console.error('Failed to add contact:', err);
      }
    });
  }
}
