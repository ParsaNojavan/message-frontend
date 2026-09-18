import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  ngOnInit(): void {
    this.chatService.loadConversations();
  }
}
