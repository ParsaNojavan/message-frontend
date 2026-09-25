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
      <!-- Trigger Button -->
      <button
        hlmDialogTrigger
        type="button"
        class="inline-flex items-center justify-center size-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 shrink-0 cursor-pointer">
        <ng-icon name="lucideSearch" class="text-lg"></ng-icon>
      </button>

      <!-- Main Modal Content -->
      <hlm-dialog-content *hlmDialogPortal="let ctx"
        class="w-[92vw] sm:max-w-lg bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <!-- Header & Search Input Box -->
        <div class="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-2.5 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <div class="flex items-center justify-between">
            <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ng-icon name="lucideSearch" class="text-emerald-600 dark:text-emerald-400 text-base"></ng-icon>
              <span>Search in Chat</span>
            </h3>
            
          <button 
            type="button"
            (click)="ctx.close()" 
            class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-base"></ng-icon>
          </button>
          </div>

          <div class="relative flex items-center">
            <ng-icon name="lucideSearch" class="absolute left-3 text-zinc-400 dark:text-zinc-500 text-base pointer-events-none"></ng-icon>
            
            <input 
              #searchInput
              type="text" 
              [ngModel]="query()"
              (ngModelChange)="query.set($event)"
              placeholder="Search messages..."
              class="w-full bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all duration-150 shadow-inner"
              autofocus />

            @if (query()) {
              <button 
                type="button" 
                (click)="resetSearch()" 
                class="absolute right-3 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors cursor-pointer">
                <ng-icon name="lucideX" class="text-sm block"></ng-icon>
              </button>
            }
          </div>
        </div>

        <!-- Search Results Count Banner -->
        @if (query().trim()) {
          <div class="px-4 py-1.5 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <span>{{ searchResults().length }} message(s) found</span>
            @if (searchResults().length > 0) {
              <span class="text-zinc-400 dark:text-zinc-500">Click to jump</span>
            }
          </div>
        }

        <!-- Results List Area -->
        <div class="p-2 max-h-[60vh] min-h-[220px] overflow-y-auto space-y-1 custom-scrollbar">
          
          @if (!query().trim()) {
            <!-- Empty Query State -->
            <div class="flex flex-col items-center justify-center py-14 text-center text-zinc-500 dark:text-zinc-400 gap-2 select-none">
              <div class="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-1">
                <ng-icon name="lucideMessageSquare" class="text-2xl"></ng-icon>
              </div>
              <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Search Chat History</span>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                Type keywords to find specific messages in this conversation.
              </p>
            </div>
          }

          @else if (searchResults().length === 0) {
            <!-- No Matches State -->
            <div class="flex flex-col items-center justify-center py-14 text-center text-zinc-500 dark:text-zinc-400 gap-2 select-none">
              <div class="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-1">
                <ng-icon name="lucideSearch" class="text-2xl"></ng-icon>
              </div>
              <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">No Messages Found</span>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                No matching messages found for "<span class="text-zinc-900 dark:text-zinc-100 font-semibold">{{ query() }}</span>".
              </p>
            </div>
          }

          @else {
            <!-- Messages Items -->
            @for (msg of searchResults(); track msg.id) {
              <button 
                type="button"
                (click)="onSelectMessage(msg, ctx)"
                class="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:bg-zinc-200/70 dark:active:bg-zinc-800 transition-colors duration-150 group cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60">
                
                <div 
                  class="size-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  [ngClass]="msg.isSender 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'">
                  {{ msg.isSender ? 'You' : 'User' }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span 
                      class="text-xs font-semibold truncate"
                      [ngClass]="msg.isSender ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'">
                      {{ msg.isSender ? 'You' : 'Contact' }}
                    </span>
                    <span class="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center gap-1">
                      <ng-icon name="lucideClock" class="text-[10px]"></ng-icon>
                      {{ msg.time }}
                    </span>
                  </div>

                  <p class="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors line-clamp-2 leading-relaxed break-words" dir="auto">
                    {{ msg.text }}
                  </p>
                </div>

                <ng-icon name="lucideChevronRight" class="text-zinc-400/70 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 text-sm shrink-0 self-center transition-transform group-hover:translate-x-0.5"></ng-icon>
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
