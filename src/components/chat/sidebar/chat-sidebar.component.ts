import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideSearch, lucidePlus, lucideCheckCheck } from '@ng-icons/lucide';

// Spartan UI New Imports
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    HlmInputImports,
    HlmAvatarImports,
    HlmBadgeImports
  ],
  providers: [provideIcons({ lucideSearch, lucidePlus, lucideCheckCheck })],
  templateUrl: './chat-sidebar.component.html'
})
export class ChatSidebarComponent {
  readonly chatService = inject(ChatService);
}
