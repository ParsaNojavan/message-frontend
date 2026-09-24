import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  signal,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import 'emoji-picker-element';

// Lucide Icons
import {
  lucidePhone,
  lucideVideo,
  lucideSearch,
  lucideMoreVertical,
  lucideSend,
  lucidePaperclip,
  lucideSmile,
  lucideCheckCheck,
  lucidePin,
  lucideReply,
  lucideCopy,
  lucideForward,
  lucidePencil,
  lucideTrash2,
  lucideImage,
  lucideFileText,
  lucideHeadphones,
  lucideCamera,
  lucideDelete,
  lucideUsers,
  lucideArrowLeft,
  lucideChevronRight,
  lucideChevronDown
} from '@ng-icons/lucide';

// Spartan UI New Imports
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmBubbleImports } from '@spartan-ng/helm/bubble';
import { Message, MessageReaction, ReactionSummaryItem } from '../../../models/message.model';
import {
  UserProfileModalComponent,
  UserProfileData,
  VideoItem,
  FileItem,
  GroupItem
} from '../modals/user-dialog.component';
import { SearchMessagesDialogComponent } from '../modals/search-message.component';
import { MediaUploadModalComponent, UploadPayload } from '../modals/media-upload-modal.component';
import { CallPeer, CallService } from '../../../services/call/call.service';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmAvatarImports,
    HlmButtonImports,
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    HlmBubbleImports,
    UserProfileModalComponent,
    SearchMessagesDialogComponent,
    MediaUploadModalComponent
  ],
  providers: [
    provideIcons({
      lucidePhone,
      lucideVideo,
      lucideSearch,
      lucideMoreVertical,
      lucideSend,
      lucidePaperclip,
      lucideSmile,
      lucideCheckCheck,
      lucidePin,
      lucideReply,
      lucideCopy,
      lucideForward,
      lucidePencil,
      lucideTrash2,
      lucideImage,
      lucideFileText,
      lucideHeadphones,
      lucideCamera,
      lucideDelete,
      lucideUsers,
      lucideArrowLeft,
      lucideChevronRight,
      lucideChevronDown
    })
  ],
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements AfterViewChecked {
  readonly chatService = inject(ChatService);
  readonly callService = inject(CallService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  messageText = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('uploadModal') uploadModal!: MediaUploadModalComponent;

  readonly currentUserId = 'current-user-id';
  readonly currentUserName = 'You';

  isAttachmentOpen = signal(false);
  isEmojiOpen = signal(false);
  activeTab: 'emoji' | 'gif' | 'sticker' = 'emoji';
  showingReactionsForMsgId: string | number | null = null;
  highlightedMessageId = signal<string | number | null>(null);
  lazyUserFallback = signal<{ name: string; phone?: string; avatar?: string } | null>(null);

  quickReactions = ['👍', '❤️', '🔥', '👏', '🎉', '😂', '😮', '😢', '😍', '🤔', '💯', '🙏', '✨', '⚡'];

  // محاسبه وضعیت فعال بودن نوتیفیکیشن‌ها براساس mutedUntil روم جاری
  readonly isNotificationsEnabled = computed(() => {
    const active = this.chatService.activeConversation();
    if (!active?.mutedUntil) return true;
    const mutedDate = new Date(active.mutedUntil as any);
    return isNaN(mutedDate.getTime()) || mutedDate.getTime() <= Date.now();
  });

  selectedUser = computed<UserProfileData>(() => {
    const activeChat = this.chatService.activeConversation();
    const lazyUser = this.lazyUserFallback();
    const activeName = activeChat?.name || lazyUser?.name || 'Unknown';

    return {
      name: activeName,
      phone: activeChat?.phoneNumber || lazyUser?.phone,
      avatar: activeChat?.avatar || lazyUser?.avatar,
      isOnline: false,
      lastSeen: 'last seen Wednesday at 18:00',
      avatarColor: 'bg-emerald-600 text-white',
      notificationsEnabled: this.isNotificationsEnabled()
    };
  });


  lazyUserId: string | null = null;

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const userId = params.get('userId');
      const nameFromQuery = params.get('name');
      const contactState = history.state?.contact;

      this.lazyUserId = userId; // 👈 آیدی کاربر را اینجا ذخیره کنید

      if (userId && !this.chatService.activeConversationId()) {
        const contactName = contactState?.customFirstName
          ? `${contactState.customFirstName} ${contactState.customLastName || ''}`.trim()
          : (nameFromQuery || 'در حال بارگذاری...');

        this.lazyUserFallback.set({
          name: contactName,
          phone: contactState?.contactUser?.phoneNumber,
          avatar: contactState?.contactUser?.avatar
        });
      } else {
        this.lazyUserFallback.set(null);
      }
    });
  }

  chatPhotos = signal<string[]>([
    'https://shut.ir/storage/image/2026/9/11/%D8%AF%D8%A7%D9%86%D9%84%D9%88%D8%AF-%D8%AA%D8%B5%D9%88%DB%8C%D8%B1-%D8%B2%D9%85%DB%8C%D9%86%D9%87-%D8%AF%D8%AE%D8%AA%D8%B1%D8%A7%D9%86%D9%87-%D8%AE%D8%A7%D8%B5-%D9%88-%D8%AC%D8%AF%DB%8C%D8%AF.webp',
    'https://shut.ir/storage/image/2026/9/11/%D8%B9%DA%A9%D8%B3-%D9%88%D8%A7%D9%84%D9%BE%DB%8C%D9%BE%D8%B1-%D8%A7%D8%B3%DA%A9%D9%84%D8%AA-%D9%81%D8%B1%D8%B4%D8%AA%D9%87.webp',
    'https://shut.ir/storage/image/2026/9/11/%D8%B9%DA%A9%D8%B3-%D8%AA%D8%B5%D9%88%DB%8C%D8%B1-%D8%B2%D9%85%DB%8C%D9%86%D9%87-%D8%AF%D8%AE%D8%AA%D8%B1%D8%A7%D9%86%D9%87-%D9%87%D9%86%D8%B1%DB%8C-%D9%88-%D8%B2%DB%8C%D8%A8%D8%A7.webp'
  ]);

  chatVideos = signal<VideoItem[]>([
    {
      thumbnail: 'https://shut.ir/storage/image/2026/9/11/%D8%B9%DA%A9%D8%B3-%D8%AA%D8%B1%D8%B3%D9%86%D8%A7%DA%A9-8k.webp',
      duration: '0:42'
    }
  ]);

  chatFiles = signal<FileItem[]>([
    { name: 'Family_Recipe.pdf', size: '1.2 MB' },
    { name: 'Invoice_Sep2026.pdf', size: '480 KB' }
  ]);

  commonGroups = signal<GroupItem[]>([
    { name: 'Family Group', membersCount: 5 },
    { name: 'Home Renovation', membersCount: 3 }
  ]);

  toggleAttachmentMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isAttachmentOpen.update(v => !v);
    this.isEmojiOpen.set(false);
  }

  toggleEmojiMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isEmojiOpen.update(v => !v);
    this.isAttachmentOpen.set(false);
  }

  onEmojiSelect(event: any) {
    const emoji = event.detail?.unicode;
    if (emoji) {
      this.messageText += emoji;
    }
  }

  deleteLastChar() {
    if (!this.messageText) return;
    const chars = Array.from(this.messageText);
    chars.pop();
    this.messageText = chars.join('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('#attachment-wrapper')) {
      this.isAttachmentOpen.set(false);
    }
    if (!target.closest('#emoji-wrapper')) {
      this.isEmojiOpen.set(false);
    }
  }

  onAttachmentSelect(type: string) {
    this.isAttachmentOpen.set(false);
  }

  async send() {
    const content = this.messageText.trim();
    if (!content) return;

    try {
      let currentRoomId = this.chatService.activeConversationId();

      if (!currentRoomId && this.lazyUserId) {
        console.log(this.lazyUserId)
        const roomResponse: any = await firstValueFrom(this.chatService.startDirectChat(this.lazyUserId));
        currentRoomId = roomResponse?.data?.roomId

        if (currentRoomId) {
          if (typeof this.chatService.setActiveConversation === 'function') {
            this.chatService.setActiveConversation(currentRoomId);
          } else {
            this.chatService.activeConversationId.set(currentRoomId);
          }
        }
      }

      if (!currentRoomId) {
        console.error('Room ID is missing and could not be created.');
        return;
      }

      this.chatService.sendMessage(content);

      this.chatService.loadConversations();

      this.messageText = '';
      this.router.navigate([], {
        queryParams: { id: currentRoomId },
        replaceUrl: true
      });

    } catch (error) {
      console.error('Error starting chat: ', error);
    }
  }


  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  onReply(msg: any) {
    console.log('Reply to message:', msg);
  }

  onCopy(msg: any) {
    const contentToCopy = msg.text || msg.content;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
    }
  }

  onForward(msg: any) {
    console.log('Forward message:', msg);
  }

  onPin(msg: any) {
    console.log('Pin message:', msg);
  }

  onEdit(msg: any) {
    console.log('Edit message:', msg);
  }

  onDelete(msg: any) {
    console.log('Delete message:', msg);
  }

  onReaction(msg: any, emoji: string) {
    if (!msg.reactions) {
      msg.reactions = [];
    }

    const existingIndex = msg.reactions.findIndex((r: any) =>
      typeof r === 'object' ? r.userId === this.currentUserId : false
    );

    if (existingIndex > -1) {
      if (msg.reactions[existingIndex].emoji === emoji) {
        msg.reactions.splice(existingIndex, 1);
      } else {
        msg.reactions[existingIndex].emoji = emoji;
      }
    } else {
      msg.reactions.push({
        userId: this.currentUserId,
        userName: this.currentUserName,
        emoji: emoji
      });
    }
  }

  getUserReaction(msg: any): string | null {
    if (!msg.reactions || !Array.isArray(msg.reactions)) return null;
    const found = msg.reactions.find((r: any) =>
      typeof r === 'object' ? r.userId === this.currentUserId : false
    );
    return found ? found.emoji : null;
  }

  getReactionSummary(msg: any): ReactionSummaryItem[] {
    if (!msg.reactions || !Array.isArray(msg.reactions) || msg.reactions.length === 0) {
      return [];
    }

    const summaryMap = new Map<string, { count: number; users: string[]; hasCurrentUser: boolean }>();

    for (const item of msg.reactions) {
      const emoji = typeof item === 'object' ? item.emoji : item;
      const userName = typeof item === 'object' ? item.userName : 'Unknown';
      const isCurrent = typeof item === 'object' ? item.userId === this.currentUserId : false;

      const current = summaryMap.get(emoji) || { count: 0, users: [], hasCurrentUser: false };
      current.count++;
      current.users.push(userName);
      if (isCurrent) current.hasCurrentUser = true;
      summaryMap.set(emoji, current);
    }

    return Array.from(summaryMap.entries()).map(([emoji, data]) => ({
      emoji,
      ...data
    }));
  }

  onBadgeClick(msg: any, emoji: string, event: MouseEvent) {
    event.stopPropagation();
    this.onReaction(msg, emoji);
  }

  onEmojiWheel(event: WheelEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (container) {
      event.preventDefault();
      container.scrollLeft += event.deltaY;
    }
  }

  onNotificationsToggled(isMuted: boolean) {
    const activeId = this.chatService.activeConversationId();
    if (!activeId) return;

    const durationMinutes = isMuted ? -1 : 0;

    this.chatService.muteRoom(activeId, durationMinutes).subscribe({
      next: () => {
        const current = this.chatService.activeConversation();
        if (current) {
          current.mutedUntil = isMuted ? new Date(8640000000000000).toISOString() : null;
        }
      },
      error: (err) => console.error('Error muting room: ', err)
    });
  }

  onDirectChatClicked() {
    console.log('Direct chat initiated from profile dialog');
  }

  getReactionsList(msg: any): MessageReaction[] {
    if (!msg?.reactions) return [];
    return Array.isArray(msg.reactions) ? msg.reactions : [msg.reactions];
  }

  openReactionsDetail(msgId: string | number, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.showingReactionsForMsgId = msgId;
  }

  closeReactionsDetail(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.showingReactionsForMsgId = null;
  }

  scrollToMessage(message: Message) {
    if (!message?.id) return;

    setTimeout(() => {
      const element = document.getElementById(`msg-${message.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        this.highlightedMessageId.set(message.id);
        setTimeout(() => this.highlightedMessageId.set(null), 1500);
      }
    }, 100);
  }

  onFilePicked(event: Event, type: 'media' | 'document' | 'audio' | 'camera') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadModal.open(input.files, type);
      input.value = '';
    }
  }

  handleFileSend(payload: UploadPayload) {
    console.log('Sending payload:', payload);
  }

  async handleStartCall(peer: CallPeer, isVideo: boolean) {
    await this.callService.startCall(
      peer,
      isVideo,
      'ws://localhost:7880',
      'test-token'
    );

    this.router.navigate(['/call', peer.id]);
  }

  goBack() {
    this.chatService.activeConversationId.set(null);
    this.router.navigate(['/chat'], {
      queryParams: {}
    });
  }
}
