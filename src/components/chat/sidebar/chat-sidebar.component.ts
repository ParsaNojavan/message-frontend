import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChatService } from '../../../services/chat/chat.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { ContactsService } from '../../../services/chat/contacts.service';
import { AuthService } from '../../../services/auth/auth.service';
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
  lucidePin,
  lucidePinOff,
  lucideFolderPlus,
  lucideMessageSquareDot,
  lucideBell,
  lucideBellOff,
  lucideArchive,
  lucideCheckSquare,
  lucideMessageSquare,
  lucideUserPlus,
  lucideEraser
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
import { AddContactDialogComponent } from '../modals/add-contact-dialog.component';
import { EditContactDialogComponent } from '../modals/edit-contact-dialog.component';
import { DeleteContactDialogComponent } from '../modals/delete-contact-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
  ConfirmDialogResult
} from '../modals/confirm-dialog.component';

import { Conversation, ConversationFilter, RecentContact, SearchResultItem } from '../../../models/conversation.model';
import { Contact } from '../../../models/contact.model';
import { formatChatTime } from '../../../../libs/utils/format-date';

interface ContextMenuOption {
  label?: string;
  action?: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  isSeparator?: boolean;
}

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
    AddContactDialogComponent,
    EditContactDialogComponent,
    DeleteContactDialogComponent,
    ConfirmDialogComponent
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
      lucidePin,
      lucidePinOff,
      lucideFolderPlus,
      lucideMessageSquareDot,
      lucideBell,
      lucideBellOff,
      lucideArchive,
      lucideCheckSquare,
      lucideMessageSquare,
      lucideUserPlus,
      lucideEraser
    })
  ],
  templateUrl: './chat-sidebar.component.html'
})
export class ChatSidebarComponent implements OnInit {
  readonly chatService = inject(ChatService);
  readonly themeService = inject(ThemeService);
  readonly contactsService = inject(ContactsService);
  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  private readonly confirmDialog = viewChild.required(ConfirmDialogComponent);

  readonly currentUser = this.authService.userProfile;
  readonly formatChatTime = formatChatTime;

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'User';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.username || user.phoneNumber || 'User';
  });

  readonly userAvatar = computed(() => {
    const user = this.currentUser() as any;
    return user?.avatar || user?.photoUrl || null;
  });

  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';

    if (user.firstName || user.lastName) {
      const f = user.firstName ? user.firstName.charAt(0) : '';
      const l = user.lastName ? user.lastName.charAt(0) : '';
      return `${f}${l}`.toUpperCase() || 'U';
    }

    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }

    return 'U';
  });

  currentView = signal<'chats' | 'search' | 'profile' | 'contacts'>('chats');
  searchQuery = signal<string>('');
  selectedTab = signal<'all' | 'group' | 'channel' | 'dm'>('all');
  activeMenuChat = signal<Conversation | null>(null);
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

  activeMenuOptions = computed<ContextMenuOption[]>(() => {
    const chat = this.activeMenuChat();
    if (!chat) return [];

    const type = (chat.type || 'DM').toUpperCase();
    const role = (chat.role || 'MEMBER').toUpperCase();
    const isPinned = Boolean(chat.pinnedAt || chat.pinned);
    const isMuted = this.chatService.isRoomMuted(chat.mutedUntil);

    const options: ContextMenuOption[] = [];

    options.push({ label: 'View Profile', action: 'profile', icon: 'lucideUser' });

    if (isPinned) {
      options.push({ label: 'Unpin', action: 'unpin', icon: 'lucidePinOff' });
    } else {
      options.push({ label: 'Pin', action: 'pin', icon: 'lucidePin' });
    }

    options.push({ label: 'Mark as unread', action: 'unread', icon: 'lucideMessageSquareDot' });

    if (isMuted) {
      options.push({ label: 'Unmute', action: 'unmute', icon: 'lucideBell' });
    } else {
      options.push({ label: 'Mute', action: 'mute', icon: 'lucideBellOff' });
    }

    options.push({ label: 'Archive', action: 'archive', icon: 'lucideArchive' });
    options.push({ isSeparator: true });

    if (type === 'DM' || type === 'GROUP') {
      options.push({
        label: 'Clear History',
        action: 'clear-history',
        icon: 'lucideEraser',
        variant: 'destructive'
      });
    }

    if (type === 'DM') {
      options.push({
        label: 'Delete Chat',
        action: 'delete-dm',
        icon: 'lucideTrash2',
        variant: 'destructive'
      });
    } else if (type === 'GROUP') {
      options.push({
        label: 'Leave Group',
        action: 'leave-group',
        icon: 'lucideLogOut',
        variant: 'destructive'
      });
      if (role === 'OWNER') {
        options.push({
          label: 'Delete Group',
          action: 'delete-group',
          icon: 'lucideTrash2',
          variant: 'destructive'
        });
      }
    } else if (type === 'CHANNEL') {
      options.push({
        label: 'Leave Channel',
        action: 'leave-channel',
        icon: 'lucideLogOut',
        variant: 'destructive'
      });
      if (role === 'OWNER') {
        options.push({
          label: 'Delete Channel',
          action: 'delete-channel',
          icon: 'lucideTrash2',
          variant: 'destructive'
        });
      }
    }

    return options;
  });

  ngOnInit(): void {
    this.contactsService.getContacts().subscribe({
      error: (err) => console.error('Failed to load contacts:', err)
    });

    if (!this.currentUser()) {
      this.authService.getUserProfile().subscribe({
        error: (err) => console.error('Failed to load profile in sidebar:', err)
      });
    }
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

    const filtered = conversations.filter(chat => {
      if ((chat as any).archived) return false;
      const matchesType = filter === 'ALL' || chat.type?.toUpperCase() === filter;
      const matchesSearch =
        !query ||
        chat.name.toLowerCase().includes(query) ||
        (chat.lastMessage?.toLowerCase().includes(query) ?? false);
      return matchesType && matchesSearch;
    });

    // مرتب‌سازی: چت‌های پین شده همیشه بالا باشند
    return [...filtered].sort((a, b) => {
      const aPinned = Boolean(a.pinnedAt || a.pinned);
      const bPinned = Boolean(b.pinnedAt || b.pinned);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (aPinned && bPinned) {
        const pinTimeA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const pinTimeB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        if (pinTimeA !== pinTimeB) return pinTimeB - pinTimeA;
      }

      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  });

  chatCounts = computed(() => {
    const list = (this.chatService.conversations() || []).filter(c => !(c as any).archived);
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

  private askConfirm(config: ConfirmDialogConfig): Promise<ConfirmDialogResult> {
    return this.confirmDialog().open(config);
  }

  private notify(title: string, message?: string): Promise<ConfirmDialogResult> {
    return this.confirmDialog().open({ title, message, mode: 'alert', confirmText: 'Got it' });
  }

  onSelectContact(contact: Contact): void {
    const contactUserId = contact.contactUserId || contact.contactUser?._id;
    const fullName = this.getContactFullName(contact);

    if (contact.roomId) {
      this.router.navigate(['/chat'], {
        queryParams: { id: contact.roomId }
      });
    } else if (contactUserId) {
      this.router.navigate(['/chat'], {
        queryParams: {
          userId: contactUserId,
          name: fullName !== 'Unknown' ? fullName : undefined
        },
        state: { contact }
      });
    }

    this.backToChats();
  }

  redirectSupport(): void {
    window.open('https://t.me/support', '_blank');
  }

  onNewContactAdded(_newContactData: any): void {
    this.contactsService.getContacts().subscribe();
  }

  onContactUpdated(_updatedContact: Contact): void {
    this.contactsService.getContacts().subscribe();
  }

  onContactDeleted(_deletedContactId: string): void {
    this.contactsService.getContacts().subscribe();
  }

  private lastActionTimestamp = 0;

  onChatMouseDown(event: MouseEvent, chat: Conversation): void {
    if (event.button === 2) {
      this.activeMenuChat.set(chat);
    }
  }

  onChatContextMenu(_event: MouseEvent, chat: Conversation): void {
    this.activeMenuChat.set(chat);
  }

  onMenuItemMouseDown(event: MouseEvent, action: string): void {
    // فقط چپ‌کلیک روی آیتم منو
    if (event.button !== 0) return;
    this.handleAction(action);
  }

  async handleAction(action: string): Promise<void> {
    // جلوگیری از اجرای دوبار در صورت فایر شدن همزمان mousedown و click
    const now = Date.now();
    if (now - this.lastActionTimestamp < 250) return;
    this.lastActionTimestamp = now;

    if (action === 'saved-messages' || action === 'guide') {
      console.log(`Global action: ${action}`);
      return;
    }

    const chat = this.activeMenuChat();
    if (!chat) {
      console.warn('No active chat selected for context menu action:', action);
      return;
    }

    const roomId = chat.id;
    const chatName = chat.name;
    const type = (chat.type || 'DM').toUpperCase();

    switch (action) {
      case 'profile': {
        this.chatService.setActiveConversation(roomId);
        this.router.navigate(['/chat'], { queryParams: { id: roomId, info: 'true' } });
        break;
      }

      case 'pin': {
        this.chatService.pinRoom(roomId);
        break;
      }

      case 'unpin': {
        this.chatService.unpinRoom(roomId);
        break;
      }

      case 'mute': {
        this.chatService.muteRoom(roomId, 525600).subscribe({
          error: (err) => console.error('Mute failed:', err)
        });
        break;
      }

      case 'unmute': {
        this.chatService.unmuteRoom(roomId).subscribe({
          error: (err) => console.error('Unmute failed:', err)
        });
        break;
      }

      case 'unread': {
        this.chatService.markAsUnread(roomId);
        break;
      }

      case 'archive': {
        this.chatService.archiveRoom(roomId);
        break;
      }

      case 'unarchive': {
        this.chatService.unarchiveRoom(roomId);
        break;
      }

      case 'clear-history': {
        const { confirmed, checked } = await this.askConfirm({
          title: 'Clear History',
          message: `Are you sure you want to clear all message history in "${chatName}"?`,
          confirmText: 'Clear',
          variant: 'destructive',
          checkboxLabel: type === 'DM' ? `Also clear history for ${chatName}` : undefined,
          checkboxDefault: false
        });
        if (!confirmed) return;

        this.chatService.clearHistory(roomId, type, type === 'DM' ? checked : false);
        break;
      }

      case 'delete-dm': {
        const { confirmed, checked } = await this.askConfirm({
          title: 'Delete Chat',
          message: `Are you sure you want to delete conversation with "${chatName}"?`,
          confirmText: 'Delete',
          variant: 'destructive',
          checkboxLabel: `Also delete for ${chatName}`,
          checkboxDefault: false
        });
        if (!confirmed) return;

        this.chatService.deleteDirectRoom(roomId, checked);
        break;
      }

      case 'leave-group': {
        const { confirmed } = await this.askConfirm({
          title: 'Leave Group',
          message: `Are you sure you want to leave "${chatName}"?`,
          confirmText: 'Leave',
          variant: 'destructive'
        });
        if (!confirmed) return;

        this.chatService.leaveGroup(roomId);
        break;
      }

      case 'delete-group': {
        const { confirmed } = await this.askConfirm({
          title: 'Delete Group',
          message: `Delete group "${chatName}" for ALL members? This cannot be undone.`,
          confirmText: 'Delete',
          variant: 'destructive'
        });
        if (!confirmed) return;

        this.chatService.deleteGroup(roomId);
        break;
      }

      case 'leave-channel': {
        const { confirmed } = await this.askConfirm({
          title: 'Leave Channel',
          message: `Are you sure you want to leave "${chatName}"?`,
          confirmText: 'Leave',
          variant: 'destructive'
        });
        if (!confirmed) return;

        this.chatService.leaveChannel(roomId);
        break;
      }

      case 'delete-channel': {
        const { confirmed } = await this.askConfirm({
          title: 'Delete Channel',
          message: `Delete channel "${chatName}" for ALL subscribers? This cannot be undone.`,
          confirmText: 'Delete',
          variant: 'destructive'
        });
        if (!confirmed) return;

        this.chatService.deleteChannel(roomId);
        break;
      }

      default:
        console.log(`Triggered action: ${action} on chat:`, chatName);
        break;
    }
  }
}
