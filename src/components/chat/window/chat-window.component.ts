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
import {
  Message,
  MessageMediaItem,
  MessageReply,
  MessageUserDetail,
  ReactionSummaryItemWithUsers
} from '../../../models/message.model';

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

  // استخراج نرمال‌شده و امن شناسه کاربر جاری
  get currentUserId(): string {
    const user: any = this.authService.currentUser();
    if (!user) return '';
    return String(user.id || user._id || user.sub || user.userId || (typeof user === 'string' ? user : ''));
  }

  // وضعیت‌های اسکرول
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

  // استخراج هوشمند نام کاربر با اولویت‌های مختلف
  getUserDisplayName(user?: MessageUserDetail | any | null, fallback = 'کاربر'): string {
    if (!user) return fallback;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username || user.phoneNumber || user.name || fallback;
  }

  // نام فرستنده ریپلای همراه با پشتیبانی از پیام‌های خودی و فالبک مخاطب
  getReplySenderName(reply: MessageReply | any | null | undefined): string {
    if (!reply) return 'پیام';

    const replySenderId = String(
      reply.senderId?._id ||
      reply.senderId?.id ||
      reply.sender?._id ||
      reply.sender?.id ||
      reply.senderId ||
      ''
    );

    // ۱. اگر فرستنده ریپلای خود من باشم
    if (replySenderId && this.currentUserId && replySenderId === this.currentUserId) {
      return 'شما';
    }

    // ۲. آبجکت کامل فرستنده وجود داشته باشد
    if (reply.sender) {
      const name = this.getUserDisplayName(reply.sender);
      if (name && name !== 'کاربر') return name;
    }

    // ۳. نام متنی به شکل پیش‌فرض ارسال شده باشد
    if (reply.senderName) {
      return reply.senderName;
    }

    // ۴. فالبک به مخاطب مستقیم فعلی صفحه (در صورت مطابقت شناسه یا حضور در دایرکت)
    const active = this.selectedUser();
    if (active && active.name && active.name !== 'Unknown') {
      return active.name;
    }

    return 'پیام';
  }

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
    const targetId = msg._id || msg.id;
    this.chatService.sendReaction(targetId, emoji);
  }

  getUserReaction(msg: Message): string | null {
    if (!msg.reactions || !Array.isArray(msg.reactions)) return null;
    const curId = this.currentUserId;
    if (!curId) return null;

    const found = msg.reactions.find(r => {
      const rUserId = String((r.userId as any)?._id || (r.userId as any)?.id || r.userId || '');
      return rUserId === curId;
    });

    return found ? found.emoji : null;
  }

  getReactionSummary(msg: Message): ReactionSummaryItemWithUsers[] {
    if (!msg.reactions || !Array.isArray(msg.reactions) || msg.reactions.length === 0) {
      return [];
    }

    const summaryMap = new Map<string, {
      count: number;
      hasCurrentUser: boolean;
      userProfiles: Array<{ name: string; avatar?: string }>;
    }>();

    const curId = this.currentUserId;

    for (const item of (msg.reactions as any[])) {
      const emoji = item.emoji;
      const itemUserId = String(item.userId?._id || item.userId?.id || item.userId || '');
      const isCurrent = !!curId && itemUserId === curId;

      // دریافت نام و آواتار از آبجکت کاربر یا مقادیر فالبک
      let name = item.user ? this.getUserDisplayName(item.user) : (item.userName || null);
      let avatar = item.user?.photoUrl || item.user?.avatar;

      // فالبک کلاینتی در صورتی که هنوز یوزر توسط سوکت نرسیده باشد
      if (!name || !avatar) {
        if (isCurrent) {
          const me: any = this.authService.currentUser();
          name = name || 'شما';
          avatar = avatar || me?.photoUrl || me?.avatar;
        } else {
          const active = this.selectedUser();
          name = name || active?.name || 'کاربر';
          avatar = avatar || active?.avatar;
        }
      }

      const current = summaryMap.get(emoji) || { count: 0, hasCurrentUser: false, userProfiles: [] };
      current.count++;
      if (isCurrent) {
        current.hasCurrentUser = true;
      }

      // حداکثر ۳ کاربر اول برای نمایش در حبابچه (Badge) آواتارها
      if (current.userProfiles.length < 3) {
        current.userProfiles.push({
          name: name || 'کاربر',
          avatar
        });
      }

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
    const targetId = message?._id || message?.id;
    if (!targetId) return;

    setTimeout(() => {
      const element = document.getElementById(`msg-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightedMessageId.set(targetId);
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
      const mediaList: MessageMediaItem[] = files.map(file => ({
        mediaId: crypto.randomUUID(),
        url: URL.createObjectURL(file),
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
