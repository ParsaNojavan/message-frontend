import { Component, inject, OnInit, DestroyRef } from '@angular/core';
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

  ngOnInit(): void {
    this.chatService.loadConversations();

    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const chatId = params.get('id');
      
      if (chatId) {
        this.chatService.setActiveConversation(chatId);
      } else {
        this.chatService.setActiveConversation(null);
      }
    });
  }
}
