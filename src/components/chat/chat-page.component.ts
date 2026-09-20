import { Component, inject, OnInit, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ChatSidebarComponent } from './sidebar/chat-sidebar.component';
import { ChatWindowComponent } from './window/chat-window.component';
import { ChatService } from '../../services/chat/chat.service';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatSidebarComponent, ChatWindowComponent],
  templateUrl: './chat-page.component.html'
})
export class ChatPageComponent implements OnInit {
  readonly chatService = inject(ChatService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  pendingUserId = signal<string | null>(null);

  isChatOpen = computed(() => {
    return !!this.chatService.activeConversationId() || !!this.pendingUserId();
  });

  ngOnInit(): void {
    this.chatService.loadConversations();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const roomId = params.get('id');
        const userId = params.get('userId');

        if (roomId) {
          this.chatService.setActiveConversation(roomId);
          this.pendingUserId.set(null);
        } else if (userId) {
          this.chatService.setActiveConversation(null);
          this.pendingUserId.set(userId);
        } else {
          this.chatService.setActiveConversation(null);
          this.pendingUserId.set(null);
        }
      });
  }
}
