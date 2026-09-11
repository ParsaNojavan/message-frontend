import { Component, inject, ViewChild, ElementRef, AfterViewChecked, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
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
  lucideCamera
} from '@ng-icons/lucide';

// Spartan UI New Imports
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmAvatarImports,
    HlmButtonImports,
    HlmContextMenuImports,
    HlmDropdownMenuImports
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
      lucideCamera
    })
  ],
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements AfterViewChecked {
  readonly chatService = inject(ChatService);
  messageText = '';
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // وضعیت باز/بسته بودن منوی سنجاق
  isAttachmentOpen = signal(false);

  toggleAttachmentMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isAttachmentOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('#attachment-wrapper')) {
      this.isAttachmentOpen.set(false);
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
    if (msg.content) {
      navigator.clipboard.writeText(msg.content);
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
}
