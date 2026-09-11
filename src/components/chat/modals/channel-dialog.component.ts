import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideX, lucideCamera, lucideLock, lucideGlobe, lucideCheck, lucideTv } from '@ng-icons/lucide';

type ChannelType = 'private' | 'public';

@Component({
  selector: 'app-create-channel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmDialogImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideCamera,
      lucideLock,
      lucideGlobe,
      lucideCheck,
      lucideTv
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <!-- Modal Trigger Button -->
      <button hlmDialogTrigger
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-foreground/90 hover:bg-accent/60 transition-colors">
        <ng-icon name="lucideTv" class="text-xl text-muted-foreground shrink-0"></ng-icon>
        <span class="flex-1 text-left font-medium">New Channel</span>
      </button>

      <!-- Main Modal Content -->
      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-[#18181b] border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="relative flex items-center justify-center px-4 py-3.5 border-b border-zinc-800/80">
          <button 
            (click)="ctx.close()" 
            class="absolute left-3.5 text-zinc-400 hover:text-zinc-100 cursor-pointer">
            <ng-icon name="lucideX" class="text-lg block"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-200">
            Create Channel
          </h3>
        </div>

        <div class="p-5 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <!-- Channel Avatar Upload -->
          <div class="flex justify-center mt-2 mb-6">
            <label class="relative group cursor-pointer">
              <div class="size-20 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-400 group-hover:text-red-500 group-hover:border-red-500/50 transition-all shadow-inner">
                <ng-icon name="lucideCamera" class="text-2xl"></ng-icon>
              </div>
              <input type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />
            </label>
          </div>

          <!-- Channel Name Input -->
          <div class="space-y-1">
            <div class="relative">
              <input
                type="text"
                id="channelName"
                [(ngModel)]="channelName"
                maxLength="128"
                placeholder=" "
                class="peer w-full bg-transparent border border-red-500/80 rounded-xl px-4 pt-4 pb-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder-transparent"
              />
              <label 
                for="channelName"
                class="absolute left-3 -top-2.5 bg-[#18181b] px-1.5 text-xs text-red-500 font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-red-500">
                Channel Name
              </label>
            </div>
            <div class="flex justify-end px-1 text-[11px] text-zinc-500 font-mono">
              <span>{{ channelName().length }}/128</span>
            </div>
          </div>

          <!-- Channel Type Selection -->
          <div class="space-y-3 pt-1 border-t border-zinc-800/60">
            <span class="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">Channel Type</span>

            <!-- Private Channel Radio Option -->
            <label 
              (click)="channelType.set('private')"
              class="flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <div class="space-y-1 text-left">
                <span class="block text-sm font-medium text-zinc-200">Private Channel</span>
                <p class="text-xs text-zinc-400 leading-relaxed">
                  Private channels can only be joined via an invite link or direct invitation from administrators.
                </p>
              </div>
              <div class="mt-0.5 shrink-0 size-5 rounded-full border border-zinc-600 flex items-center justify-center transition-colors"
                [class.border-red-500]="channelType() === 'private'">
                <div *ngIf="channelType() === 'private'" class="size-2.5 rounded-full bg-red-600"></div>
              </div>
            </label>

            <!-- Public Channel Radio Option -->
            <label 
              (click)="channelType.set('public')"
              class="flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-zinc-800/40 cursor-pointer transition-colors">
              <div class="space-y-1 text-left">
                <span class="block text-sm font-medium text-zinc-200">Public Channel</span>
                <p class="text-xs text-zinc-400 leading-relaxed">
                  Public channels can be found in search, and anyone can join them.
                </p>
              </div>
              <div class="mt-0.5 shrink-0 size-5 rounded-full border border-zinc-600 flex items-center justify-center transition-colors"
                [class.border-red-500]="channelType() === 'public'">
                <div *ngIf="channelType() === 'public'" class="size-2.5 rounded-full bg-red-600"></div>
              </div>
            </label>
          </div>

          <!-- Public Channel Slug Input (Visible only if Public) -->
          <div *ngIf="channelType() === 'public'" class="space-y-2 pt-2">
            <p class="text-xs text-zinc-400 leading-relaxed">
              People can search for and find your channel using this public link.
            </p>
            
            <div class="relative">
              <div class="flex items-center bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-3 py-2 focus-within:border-red-500 transition-colors">
                <span class="text-xs text-zinc-500 select-none font-mono">https://linkchain.ir/</span>
                <input
                  type="text"
                  [(ngModel)]="channelSlug"
                  placeholder="channel_name"
                  class="w-full bg-transparent text-sm text-zinc-100 focus:outline-none font-mono pl-1"
                />
              </div>
              <label class="absolute left-3 -top-2.5 bg-[#18181b] px-1 text-[11px] text-zinc-400 font-medium">
                Channel Link
              </label>
            </div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between gap-3 px-5 py-4 border-t border-zinc-800/80 bg-zinc-900/30">
          <button 
            (click)="ctx.close()"
            class="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl transition-colors">
            Cancel
          </button>

          <button 
            (click)="onCreate(ctx)"
            [disabled]="!channelName().trim()"
            class="px-5 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl shadow-lg shadow-red-950/40 transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed">
            Confirm & Continue
          </button>
        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class CreateChannelDialogComponent {
  channelName = signal<string>('');
  channelType = signal<ChannelType>('public');
  channelSlug = signal<string>('');

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      console.log('Selected channel avatar:', file);
    }
  }

  onCreate(ctx: any) {
    if (!this.channelName().trim()) return;

    const payload = {
      title: this.channelName(),
      type: this.channelType(),
      slug: this.channelType() === 'public' ? this.channelSlug() : null
    };

    console.log('Creating Channel:', payload);
    ctx.close();
  }
}
