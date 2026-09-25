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
import { AuthService } from '../../../services/auth/auth.service';
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
  lucideCheck,
  lucideCheckCheck,
  lucideClock,
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
  lucideArrowLeft,
  lucideChevronRight,
  lucideChevronDown,
  lucideMessageSquare,
  lucideX
} from '@ng-icons/lucide';

// Spartan UI Imports
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmBubbleImports } from '@spartan-ng/helm/bubble';

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
import { Message, MessageMediaItem, ReactionSummaryItem } from '../../../models/message.model';

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
      lucideCheck,
      lucideCheckCheck,
      lucideClock,
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
      lucideArrowLeft,
      lucideChevronRight,
      lucideChevronDown,
      lucideMessageSquare,
      lucideX
    })
  ],
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements AfterViewChecked {
  readonly chatService = inject(ChatService);
  readonly callService = inject(CallService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  messageText = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('uploadModal') uploadModal!: MediaUploadModalComponent;
  @ViewChild('searchDialog', { read: ElementRef }) searchDialogRef?: ElementRef<HTMLElement>;
  @ViewChild(SearchMessagesDialogComponent) searchDialogComponent?: SearchMessagesDialogComponent;

  // شناسه کاربری لاگین‌شده
  get currentUserId(): string {
    return String(this.authService.currentUser() || 'current-user-id');
  }

  // متغیرهای وضعیت اسکرول
  showScrollBottom = signal(false);
  private isNearBottom = true;
  private previousMessageCount = 0;

  isAttachmentOpen = signal(false);
  isEmojiOpen = signal(false);
  activeTab: 'emoji' | 'gif' | 'sticker' = 'emoji';
  showingReactionsForMsgId: string | number | null = null;
  highlightedMessageId = signal<string | number | null>(null);
  lazyUserFallback = signal<{ name: string; phone?: string; avatar?: string } | null>(null);

  quickReactions = ['👍', '❤️', '🔥', '👏', '🎉', '😂', '😮', '😢', '😍', '🤔', '💯', '🙏', '✨', '⚡'];

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
      isOnline: activeChat?.isOnline ?? false,
      lastSeen: 'last seen recently',
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

      this.lazyUserId = userId;

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
    'https://shut.ir/storage/image/2026/9/11/%D8%AF%D8%A7%D9%86%D9%84%D9%88%D8%AF-%D8%AA%D8%B5%D9%88%DB%8C%D8%B1-%D8%B2%D9%85%DB%8C%D9%86%D9%87-%D8%AF%D8%AE%D8%AA%D8%B1%D8%A7%D9%86%D9%87-%D8%AE%D8%A7%D8%B5-%D9%88-%D8%AC%D8%AF%DB%8C%D8%AF.webp'
  ]);

  chatVideos = signal<VideoItem[]>([]);
  chatFiles = signal<FileItem[]>([]);
  commonGroups = signal<GroupItem[]>([]);

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const threshold = 150;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    this.showScrollBottom.set(distanceFromBottom > threshold);
    this.isNearBottom = distanceFromBottom <= threshold;
  }

  scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior
      });
      this.showScrollBottom.set(false);
      this.isNearBottom = true;
    }
  }

  ngAfterViewChecked(): void {
    const currentCount = this.chatService.currentMessages()?.length || 0;
    if (currentCount !== this.previousMessageCount) {
      this.previousMessageCount = currentCount;
      if (this.isNearBottom) {
        this.scrollToBottom('auto');
      }
    }
  }

  openSearchDialog(): void {
    if (typeof (this.searchDialogComponent as any)?.open === 'function') {
      (this.searchDialogComponent as any).open();
      return;
    }
    const triggerBtn = this.searchDialogRef?.nativeElement.querySelector('button');
    triggerBtn?.click();
  }

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

  async send() {
    const content = this.messageText.trim();
    if (!content) return;

    try {
      let currentRoomId = this.chatService.activeConversationId();

      if (!currentRoomId && this.lazyUserId) {
        const roomResponse: any = await firstValueFrom(this.chatService.startDirectChat(this.lazyUserId));
        currentRoomId = roomResponse?.data?.roomId;

        if (currentRoomId) {
          this.chatService.setActiveConversation(currentRoomId);
        }
      }

      if (!currentRoomId) {
        console.error('Room ID is missing and could not be created.');
        return;
      }

      this.chatService.sendMessage(content);
      this.messageText = '';

      setTimeout(() => this.scrollToBottom('smooth'), 50);

      this.router.navigate([], {
        queryParams: { id: currentRoomId },
        replaceUrl: true
      });

    } catch (error) {
      console.error('Error starting chat: ', error);
    }
  }

  onReply(msg: Message) {
    this.chatService.setReplyTo(msg);
  }

  scrollToReplyMessage(replyMsgId: string | number, event: MouseEvent) {
    event.stopPropagation();
    const targetElement = document.getElementById(`msg-${replyMsgId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMessageId.set(replyMsgId);
      setTimeout(() => this.highlightedMessageId.set(null), 1500);
    }
  }

  onCopy(msg: Message) {
    if (msg.content) {
      navigator.clipboard.writeText(msg.content);
    }
  }

  onForward(msg: Message) {
    console.log('Forward message:', msg);
  }

  onPin(msg: Message) {
    console.log('Pin message:', msg);
  }

  onDelete(msg: Message) {
    console.log('Delete message:', msg);
  }

  onReaction(msg: Message, emoji: string) {
    this.chatService.sendReaction(msg.id, emoji);
  }

  getUserReaction(msg: Message): string | null {
    if (!msg.reactions || !Array.isArray(msg.reactions)) return null;
    const found = msg.reactions.find(r => String(r.userId) === this.currentUserId);
    return found ? found.emoji : null;
  }

  getReactionSummary(msg: Message): ReactionSummaryItem[] {
    if (!msg.reactions || !Array.isArray(msg.reactions) || msg.reactions.length === 0) {
      return [];
    }

    const summaryMap = new Map<string, { count: number; users: string[]; hasCurrentUser: boolean }>();

    for (const item of msg.reactions) {
      const emoji = item.emoji;
      const userName = item.userName || 'کاربر';
      const isCurrent = String(item.userId) === this.currentUserId;

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

  onBadgeClick(msg: Message, emoji: string, event: MouseEvent) {
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

  async handleFileSend(payload: UploadPayload) {
    const { files, caption, type } = payload;
    if (!files || files.length === 0) return;

    try {
      // ایجاد فرمت MessageMediaItem متناسب با ساختار سرور
      const mediaList: MessageMediaItem[] = files.map(file => ({
        mediaId: crypto.randomUUID(),
        url: URL.createObjectURL(file), // در صورت داشتن سرویس آپلود، URL سرور جایگزین می‌شود
        type: file.type || (type === 'document' ? 'application/octet-stream' : 'application/file')
      }));

      this.chatService.sendMessage(caption || '', mediaList);
      setTimeout(() => this.scrollToBottom('smooth'), 60);

    } catch (err) {
      console.error('Error sending media files:', err);
    }
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
