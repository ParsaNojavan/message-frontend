import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideX,
  lucideMessageSquare,
  lucideClock,
  lucideChevronRight
} from '@ng-icons/lucide';
import { Message } from '../../../models/message.model';

@Component({
  selector: 'app-search-messages-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmDialogImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideX,
      lucideMessageSquare,
      lucideClock,
      lucideChevronRight
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <button
        hlmDialogTrigger
        type="button"
        class="inline-flex items-center justify-center size-8 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-150 shrink-0 cursor-pointer">
        <ng-icon name="lucideSearch" class="text-lg"></ng-icon>
      </button>

      <hlm-dialog-content *hlmDialogPortal="let ctx"
        class="w-[92vw] sm:max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <div class="p-3 border-b border-zinc-800/80 flex flex-col gap-2.5 bg-zinc-900/90">
          <div class="flex items-center justify-between">
            <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-200 flex items-center gap-2">
              <ng-icon name="lucideSearch" class="text-red-500 text-base"></ng-icon>
              <span>Search in Chat</span>
            </h3>
            
            <button 
              type="button"
              (click)="ctx.close(); resetSearch()" 
              class="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-lg cursor-pointer">
              <ng-icon name="lucideX" class="text-lg block"></ng-icon>
            </button>
          </div>

          <div class="relative flex items-center">
            <ng-icon name="lucideSearch" class="absolute left-3 text-zinc-500 text-base pointer-events-none"></ng-icon>
            
            <input 
              #searchInput
              type="text" 
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
              placeholder="Search messages..."
              class="w-full bg-zinc-800/70 border border-zinc-700/60 focus:border-red-500 focus:bg-zinc-800/90 rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-150 shadow-inner"
              autofocus />

            @if (query()) {
              <button 
                type="button" 
                (click)="resetSearch()" 
                class="absolute right-3 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer">
                <ng-icon name="lucideX" class="text-sm block"></ng-icon>
              </button>
            }
          </div>
        </div>

        @if (query().trim()) {
          <div class="px-4 py-1.5 bg-zinc-950/60 border-b border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>{{ searchResults().length }} message(s) found</span>
            @if (searchResults().length > 0) {
              <span class="text-zinc-500">Click to jump</span>
            }
          </div>
        }


        <div class="p-2 max-h-[60vh] min-h-[220px] overflow-y-auto space-y-1 [scrollbar-width:thin]">
          
        @if (!query().trim()) {
            <div class="flex flex-col items-center justify-center py-14 text-center text-zinc-500 gap-2 select-none">
              <div class="size-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400 mb-1">
                <ng-icon name="lucideMessageSquare" class="text-2xl"></ng-icon>
              </div>
              <span class="text-sm font-medium text-zinc-300">Search Chat History</span>
              <p class="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Type keywords to find specific messages in this conversation.
              </p>
            </div>
          }

          @else if (searchResults().length === 0) {
            <div class="flex flex-col items-center justify-center py-14 text-center text-zinc-500 gap-2 select-none">
              <div class="size-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400 mb-1">
                <ng-icon name="lucideSearch" class="text-2xl"></ng-icon>
              </div>
              <span class="text-sm font-medium text-zinc-300">No Messages Found</span>
              <p class="text-xs text-zinc-500 max-w-xs leading-relaxed">
                No matching messages found for "<span class="text-zinc-300 font-semibold">{{ query() }}</span>".
              </p>
            </div>
          }

          @else {
            @for (msg of searchResults(); track msg.id) {
              <button 
                type="button"
                (click)="onSelectMessage(msg, ctx)"
                class="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-800/70 active:bg-zinc-800 transition-colors duration-150 group cursor-pointer border border-transparent hover:border-zinc-700/50">
                
                <div 
                  class="size-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  [ngClass]="msg.isSender 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700/60'">
                  {{ msg.isSender ? 'You' : 'User' }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span 
                      class="text-xs font-semibold truncate"
                      [ngClass]="msg.isSender ? 'text-red-400' : 'text-zinc-200'">
                      {{ msg.isSender ? 'You' : 'Contact' }}
                    </span>
                    <span class="text-[11px] text-zinc-500 shrink-0 flex items-center gap-1">
                      <ng-icon name="lucideClock" class="text-[10px]"></ng-icon>
                      {{ msg.time }}
                    </span>
                  </div>

                  <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed break-words" dir="auto">
                    {{ msg.text }}
                  </p>
                </div>

                <ng-icon name="lucideChevronRight" class="text-zinc-600 group-hover:text-zinc-300 text-sm shrink-0 self-center transition-transform group-hover:translate-x-0.5"></ng-icon>
              </button>
            }
          }

        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class SearchMessagesDialogComponent {

  readonly messages = input<Message[]>([]);

  readonly messageSelected = output<Message>();

  readonly query = signal<string>('');

  readonly searchResults = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    
    return this.messages().filter(m => 
      m.text?.toLowerCase().includes(q)
    );
  });

  resetSearch(): void {
    this.query.set('');
  }

  onSelectMessage(msg: Message, ctx: any): void {
    this.messageSelected.emit(msg);
    ctx.close();
    this.resetSearch();
  }
}
