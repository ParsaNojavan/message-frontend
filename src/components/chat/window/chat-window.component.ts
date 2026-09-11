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
  lucideDelete
} from '@ng-icons/lucide';

// Spartan UI New Imports
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import {
  UserProfileModalComponent,
  UserProfileData,
  VideoItem,
  FileItem,
  GroupItem
} from '../modals/user-dialog.component';

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
    HlmAvatarImports,
    UserProfileModalComponent
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
      lucideDelete
    })
  ],
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements AfterViewChecked {
  readonly chatService = inject(ChatService);
  messageText = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isAttachmentOpen = signal(false);
  isEmojiOpen = signal(false);
  activeTab: 'emoji' | 'gif' | 'sticker' = 'emoji';
  isNotificationsEnabled = signal(true);
  selectedUser = computed<UserProfileData>(() => {
    const activeName = this.chatService.activeConversation()?.name || 'Unknown';

    return {
      name: activeName,
      phone: '+989144190723',
      isOnline: false,
      lastSeen: 'last seen Wednesday at 18:00',
      avatarColor: 'bg-red-600',
      notificationsEnabled: this.isNotificationsEnabled()
    };
  });

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
    console.log('Selected attachment type:', type);
    this.isAttachmentOpen.set(false);
  }

  send() {
    if (!this.messageText.trim()) return;
    this.chatService.sendMessage(this.messageText);
    this.messageText = '';
    this.isEmojiOpen.set(false);
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
    console.log('Reaction:', emoji, 'on message:', msg.id);
  }

  onEmojiWheel(event: WheelEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (container) {
      event.preventDefault();
      container.scrollLeft += event.deltaY;
    }
  }

  onFilePicked(event: Event, type: 'media' | 'document' | 'audio' | 'camera') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    console.log(`Selected ${type} files:`, files);
    input.value = '';
  }

  onNotificationsToggled(enabled: boolean) {
    this.isNotificationsEnabled.set(enabled);
  }

  onDirectChatClicked() {
    console.log('Direct chat initiated from profile dialog');
  }
}
