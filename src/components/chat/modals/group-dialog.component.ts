import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideX, lucideCamera, lucideLock, lucideGlobe, lucideCheck, lucideUsers } from '@ng-icons/lucide';

type GroupType = 'private' | 'public';

@Component({
  selector: 'app-create-group-dialog',
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
      lucideUsers
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <!-- Modal Trigger Button -->
      <button hlmDialogTrigger
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-foreground/90 hover:bg-accent/60 transition-colors cursor-pointer">
        <ng-icon name="lucideUsers" class="text-xl text-muted-foreground shrink-0"></ng-icon>
        <span class="flex-1 text-left font-medium">New Group</span>
      </button>

      <!-- Main Modal Content -->
      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-popover border border-border text-popover-foreground p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="relative flex items-center justify-center px-4 py-3.5 border-b border-border/70">
          <button 
            (click)="ctx.close()" 
            class="absolute left-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-lg block"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-foreground">
            Create Group
          </h3>
        </div>

        <div class="p-5 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <!-- Group Avatar Upload -->
          <div class="flex justify-center mt-2 mb-6">
            <label class="relative group cursor-pointer">
              <div class="size-20 rounded-full bg-accent/40 border border-border flex items-center justify-center text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-all shadow-inner">
                <ng-icon name="lucideCamera" class="text-2xl"></ng-icon>
              </div>
              <input type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />
            </label>
          </div>

          <!-- Group Name Input -->
          <div class="space-y-1">
            <div class="relative">
              <input
                type="text"
                id="groupName"
                [(ngModel)]="groupName"
                maxLength="128"
                placeholder=" "
                class="peer w-full bg-transparent border border-border rounded-xl px-4 pt-4 pb-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-transparent"
              />
              <label 
                for="groupName"
                class="absolute left-3 -top-2.5 bg-popover px-1.5 text-xs text-muted-foreground font-medium transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-emerald-600 dark:peer-focus:text-emerald-400">
                Group Name
              </label>
            </div>
            <div class="flex justify-end px-1 text-[11px] text-muted-foreground font-mono">
              <span>{{ groupName().length }}/128</span>
            </div>
          </div>

          <!-- Group Type Selection -->
          <div class="space-y-3 pt-1 border-t border-border/60">
            <span class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Type</span>

            <!-- Private Group Radio Option -->
            <label 
              (click)="groupType.set('private')"
              class="flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-accent/50 cursor-pointer transition-colors"
              [class.bg-accent/40]="groupType() === 'private'">
              <div class="space-y-1 text-left">
                <span class="block text-sm font-medium text-foreground">Private Group</span>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Private groups can only be joined via an invite link or direct invitation from administrators.
                </p>
              </div>
              <div class="mt-0.5 shrink-0 size-5 rounded-full border border-border flex items-center justify-center transition-colors"
                [class.border-emerald-600]="groupType() === 'private'"
                [class.dark:border-emerald-500]="groupType() === 'private'">
                @if (groupType() === 'private') {
                  <div class="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                }
              </div>
            </label>

            <!-- Public Group Radio Option -->
            <label 
              (click)="groupType.set('public')"
              class="flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-accent/50 cursor-pointer transition-colors"
              [class.bg-accent/40]="groupType() === 'public'">
              <div class="space-y-1 text-left">
                <span class="block text-sm font-medium text-foreground">Public Group</span>
                <p class="text-xs text-muted-foreground leading-relaxed">
                  Public groups can be found in search, and anyone can join them.
                </p>
              </div>
              <div class="mt-0.5 shrink-0 size-5 rounded-full border border-border flex items-center justify-center transition-colors"
                [class.border-emerald-600]="groupType() === 'public'"
                [class.dark:border-emerald-500]="groupType() === 'public'">
                @if (groupType() === 'public') {
                  <div class="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500"></div>
                }
              </div>
            </label>
          </div>

          <!-- Public Group Slug Input (Visible only if Public) -->
          @if (groupType() === 'public') {
            <div class="space-y-2 pt-2">
              <p class="text-xs text-muted-foreground leading-relaxed">
                People can search for and find your group using this public link.
              </p>
              
              <div class="relative">
                <div class="flex items-center bg-accent/30 border border-border rounded-xl px-3 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span class="text-xs text-muted-foreground select-none font-mono">https://linkchain.ir/</span>
                  <input
                    type="text"
                    [(ngModel)]="groupSlug"
                    placeholder="group_name"
                    class="w-full bg-transparent text-sm text-foreground focus:outline-none font-mono pl-1 placeholder:text-muted-foreground/60"
                  />
                </div>
                <label class="absolute left-3 -top-2.5 bg-popover px-1 text-[11px] text-muted-foreground font-medium">
                  Group Link
                </label>
              </div>
            </div>
          }

        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between gap-3 px-5 py-4 border-t border-border/70 bg-accent/20">
          <button 
            (click)="ctx.close()"
            class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-xl transition-colors cursor-pointer">
            Cancel
          </button>

          <button 
            (click)="onCreate(ctx)"
            [disabled]="!groupName().trim()"
            class="px-5 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed">
            Confirm & Continue
          </button>
        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class CreateGroupDialogComponent {
  groupName = signal<string>('');
  groupType = signal<GroupType>('public');
  groupSlug = signal<string>('');

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      console.log('Selected group avatar:', file);
    }
  }

  onCreate(ctx: any) {
    if (!this.groupName().trim()) return;

    const payload = {
      title: this.groupName(),
      type: this.groupType(),
      slug: this.groupType() === 'public' ? this.groupSlug() : null
    };

    console.log('Creating Group:', payload);
    ctx.close();
  }
}
