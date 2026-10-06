import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
  signal,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { AuthService } from '../../../services/auth/auth.service';
import { MediaService, MediaUploadResponse } from '../../../services/media/media.service';
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
  lucideX,
  lucideMic
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
  FileItem
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
import { GroupItem } from '../../../services/chat/group.service';

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
      lucideX,
      lucideMic
    })
  ],
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements AfterViewChecked, OnDestroy {
  readonly chatService = inject(ChatService);
  readonly callService = inject(CallService);
  private readonly mediaService = inject(MediaService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  messageText = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('uploadModal') uploadModal!: MediaUploadModalComponent;
  @ViewChild('searchDialog', { read: ElementRef }) searchDialogRef?: ElementRef<HTMLElement>;
  @ViewChild(SearchMessagesDialogComponent) searchDialogComponent?: SearchMessagesDialogComponent;

  get currentUserId(): string {
    const user: any = this.authService.currentUser();
    if (!user) return '';
    return String(user.id || user._id || user.sub || user.userId || (typeof user === 'string' ? user : ''));
  }

  showScrollBottom = signal(false);
  private isNearBottom = true;
  private previousMessageCount = 0;

  isAttachmentOpen = signal(false);
  isEmojiOpen = signal(false);
  isUploadingMedia = signal(false);
  activeTab: 'emoji' | 'gif' | 'sticker' = 'emoji';
  showingReactionsForMsgId: string | number | null = null;
  highlightedMessageId = signal<string | number | null>(null);
  lazyUserFallback = signal<{ name: string; phone?: string; avatar?: string } | null>(null);

  quickReactions = ['👍', '❤️', '🔥', '👏', '🎉', '😂', '😮', '😢', '😍', '🤔', '💯', '🙏', '✨', '⚡'];

  // ==========================================
  // وضعیت و متغیرهای ضبط صدا (Voice Recording)
  // ==========================================
  isRecording = signal(false);
  recordingDuration = signal('00:00');
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingTimer: any = null;
  private recordingStartTime = 0;
  private audioStream: MediaStream | null = null;

  readonly isNotificationsEnabled = computed(() => {
    const active = this.chatService.activeConversation();
    if (!active?.mutedUntil) return true;
    const mutedDate = new Date(active.mutedUntil as any);
    return isNaN(mutedDate.getTime()) || mutedDate.getTime() <= Date.now();
  });

  // استخراج هوشمند شناسه کاربر مقابل
  readonly targetUserId = computed<string>(() => {
    if (this.lazyUserId) return this.lazyUserId;

    const activeChat: any = this.chatService.activeConversation();
    if (!activeChat) return '';

    if (activeChat.targetUserId) return String(activeChat.targetUserId);
    if (activeChat.partnerId) return String(activeChat.partnerId);
    if (activeChat.userId) return String(activeChat.userId);

    if (Array.isArray(activeChat.participants)) {
      const partner = activeChat.participants.find((p: any) => {
        const pId = String(p?._id || p?.id || p);
        return pId && pId !== this.currentUserId;
      });
      if (partner) {
        return String(partner._id || partner.id || partner);
      }
    }

    return '';
  });

  selectedUser = computed<UserProfileData>(() => {
    const activeChat = this.chatService.activeConversation();
    const lazyUser = this.lazyUserFallback();
    const activeName = activeChat?.name || lazyUser?.name || 'Unknown';

    return {
      id: this.targetUserId(),
      name: activeName,
      phone: activeChat?.phoneNumber || lazyUser?.phone,
      avatar: activeChat?.avatar || lazyUser?.avatar,
      isOnline: activeChat?.isOnline ?? false,
      bio: activeChat?.bio,
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

  readonly chatPhotos = computed<string[]>(() => {
    const msgs = this.chatService.currentMessages() || [];
    const photos: string[] = [];

    for (const msg of msgs) {
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          if (m.type?.toLowerCase().startsWith('image/') && m.url) {
            photos.push(m.url);
          }
        }
      }
    }
    return photos;
  });

  readonly chatVideos = computed<VideoItem[]>(() => {
    const msgs = this.chatService.currentMessages() || [];
    const videos: VideoItem[] = [];

    for (const msg of msgs) {
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          if (m.type?.toLowerCase().startsWith('video/') && m.url) {
            videos.push({
              thumbnail: m.url,
              duration: '0:00'
            });
          }
        }
      }
    }
    return videos;
  });

  readonly chatFiles = computed<FileItem[]>(() => {
    const msgs = this.chatService.currentMessages() || [];
    const files: FileItem[] = [];

    for (const msg of msgs) {
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          const type = m.type?.toLowerCase() || '';
          if (!type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/') && m.url) {
            files.push({
              name: (m as any).name || m.url.split('/').pop() || 'Document',
              size: (m as any).size ? `${((m as any).size / 1024).toFixed(1)} KB` : ''
            });
          }
        }
      }
    }
    return files;
  });

  getUserDisplayName(user?: MessageUserDetail | any | null, fallback = 'کاربر'): string {
    if (!user) return fallback;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.username || user.phoneNumber || user.name || fallback;
  }

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

    if (replySenderId && this.currentUserId && replySenderId === this.currentUserId) {
      return 'شما';
    }

    if (reply.sender) {
      const name = this.getUserDisplayName(reply.sender);
      if (name && name !== 'کاربر') return name;
    }

    if (reply.senderName) {
      return reply.senderName;
    }

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

  // ==========================================
  // متدهای اختصاصی ضبط و ارسال پیام صوتی
  // ==========================================
  async startRecording(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // انتخاب خودکار بهترین MimeType پشتیبانی‌شده توسط کلاینت
      let mimeType = 'audio/webm';
      let extension = 'webm';

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
        extension = 'webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
        extension = 'ogg';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
        extension = 'mp4';
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const shouldSend = this.isRecording();
        const recordedChunks = [...this.audioChunks];

        // پاکسازی اتصالات سخت‌افزاری و تایمر
        this.cleanupRecordingResources();

        if (shouldSend && recordedChunks.length > 0) {
          const audioBlob = new Blob(recordedChunks, { type: mimeType });
          // ساخت یک File استاندارد و نام‌گذاری با پسوند مناسب
          const audioFile = new File([audioBlob], `voice_${Date.now()}.${extension}`, {
            type: mimeType
          });

          // ارسال مستقیم به همان پایپ‌لاین آپلود فایل و مدیا
          await this.handleFileSend({
            files: [audioFile],
            caption: '',
            type: 'audio'
          });
        }
      };

      // دریافت داده‌ها در تکه‌های 200 میلی‌ثانیه‌ای
      this.mediaRecorder.start(200);
      this.isRecording.set(true);
      this.startRecordingTimer();

    } catch (err) {
      console.error('Microphone access denied or recording failed:', err);
      this.cleanupRecordingResources();
    }
  }

  stopAndSendRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.isRecording.set(false); // فلگ ارسال غیرفعال می‌شود تا onstop آن را بفرستد
      this.mediaRecorder.stop();
    } else {
      this.cleanupRecordingResources();
    }
  }


  private startRecordingTimer(): void {
    this.recordingStartTime = Date.now();
    this.recordingDuration.set('00:00');

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }

    this.recordingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      this.recordingDuration.set(`${minutes}:${seconds}`);
    }, 1000);
  }

  private cleanupRecordingResources(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.isRecording.set(false);
    this.recordingDuration.set('00:00');
    this.audioChunks = [];
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

      let name = item.user ? this.getUserDisplayName(item.user) : (item.userName || null);
      let avatar = item.user?.photoUrl || item.user?.avatar;

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

  onGroupSelected(group: GroupItem): void {
    const targetRoomId = group?.id || (group as any)?._id;
    if (!targetRoomId) return;

    this.chatService.setActiveConversation(targetRoomId);
    this.router.navigate([], {
      queryParams: { id: targetRoomId },
      replaceUrl: true
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
    if (!files || files.length === 0 || this.isUploadingMedia()) return;

    this.isUploadingMedia.set(true);

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

      const uploadPromises = files.map(async (file) => {
        const response: MediaUploadResponse = await firstValueFrom(this.mediaService.upload(file));
        const mediaEntity = response.data;

        const mediaItem: MessageMediaItem = {
          mediaId: mediaEntity._id || mediaEntity.id || crypto.randomUUID(),
          url: `http://localhost:3001${mediaEntity.url}`,
          type: mediaEntity.mimeType || file.type || (type === 'document' ? 'application/octet-stream' : 'application/file')
        };

        return mediaItem;
      });

      const mediaList: MessageMediaItem[] = await Promise.all(uploadPromises);

      this.chatService.sendMessage(caption || '', mediaList);

      setTimeout(() => this.scrollToBottom('smooth'), 60);

      if (this.lazyUserId && currentRoomId) {
        this.router.navigate([], {
          queryParams: { id: currentRoomId },
          replaceUrl: true
        });
      }

    } catch (err) {
      console.error('Error uploading or sending media files:', err);
    } finally {
      this.isUploadingMedia.set(false);
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

  getMediaGridClass(totalVisual: number, idx: number): string {
    switch (totalVisual) {
      case 1:
        return 'col-span-6 aspect-video max-h-72';
      case 2:
        return 'col-span-3 aspect-square max-h-52';
      case 3:
        return idx === 0
          ? 'col-span-6 aspect-video max-h-56'
          : 'col-span-3 aspect-square max-h-44';
      case 4:
        return 'col-span-3 aspect-square max-h-44';
      case 5:
        return idx < 3
          ? 'col-span-2 aspect-square max-h-36'
          : 'col-span-3 aspect-video max-h-40';
      default:
        return idx < 2
          ? 'col-span-3 aspect-square max-h-40'
          : 'col-span-2 aspect-square max-h-36';
    }
  }

  getVisualMedia(media: MessageMediaItem[] | any[] | undefined | null): MessageMediaItem[] {
    if (!media) return [];
    return media.filter(m => m.type?.toLowerCase().startsWith('image/') || m.type?.toLowerCase().startsWith('video/'));
  }

  getAudioMedia(media: MessageMediaItem[] | any[] | undefined | null): MessageMediaItem[] {
    if (!media) return [];
    return media.filter(m => m.type?.toLowerCase().startsWith('audio/'));
  }

  getDocumentMedia(media: MessageMediaItem[] | any[] | undefined | null): MessageMediaItem[] {
    if (!media) return [];
    return media.filter(m => {
      const t = m.type?.toLowerCase() || '';
      return !t.startsWith('image/') && !t.startsWith('video/') && !t.startsWith('audio/');
    });
  }

  isImageMedia(item: MessageMediaItem | any): boolean {
    return !!item?.type?.toLowerCase().startsWith('image/');
  }

  isVideoMedia(item: MessageMediaItem | any): boolean {
    return !!item?.type?.toLowerCase().startsWith('video/');
  }

  ngOnDestroy(): void {
    this.cleanupRecordingResources();
  }
}
