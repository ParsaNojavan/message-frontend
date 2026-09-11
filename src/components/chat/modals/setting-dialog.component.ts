import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideMoreVertical,
  lucideCamera,
  lucideSettings,
  lucideUser,
  lucideBell,
  lucideLock,
  lucidePalette,
  lucideFolder,
  lucideGlobe,
  lucideLogOut,
  lucideChevronRight
} from '@ng-icons/lucide';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmDialogImports,
    HlmAvatarImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideMoreVertical,
      lucideCamera,
      lucideSettings,
      lucideUser,
      lucideBell,
      lucideLock,
      lucidePalette,
      lucideFolder,
      lucideGlobe,
      lucideLogOut,
      lucideChevronRight
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <button hlmDialogTrigger
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-foreground/90 hover:bg-accent/60 transition-colors">
        <ng-icon name="lucideSettings" class="text-xl text-muted-foreground shrink-0"></ng-icon>
        <span class="flex-1 text-left font-medium">Settings</span>
      </button>

      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-[#1e1e1e] border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/60">
          <button 
            (click)="ctx.close()" 
            class="text-zinc-400 hover:text-zinc-100 cursor-pointer">
            <ng-icon name="lucideX" class="text-lg block"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-200">Settings</h3>
          
          <button 
            class="text-zinc-400 hover:text-zinc-100 cursor-pointer">
            <ng-icon name="lucideMoreVertical" class="text-lg block"></ng-icon>
          </button>
        </div>

        <!-- Settings List Options -->
        <div class="p-2 space-y-0.5 text-left max-h-[60vh] overflow-y-auto">

          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-200 transition-colors group">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideBell" class="text-lg text-zinc-400 group-hover:text-zinc-200"></ng-icon>
              <span class="text-sm font-medium">Notifications and Sounds</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-zinc-500 group-hover:text-zinc-300 text-sm"></ng-icon>
          </button>

          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-200 transition-colors group">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideLock" class="text-lg text-zinc-400 group-hover:text-zinc-200"></ng-icon>
              <span class="text-sm font-medium">Privacy and Security</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-zinc-500 group-hover:text-zinc-300 text-sm"></ng-icon>
          </button>

          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-200 transition-colors group">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucidePalette" class="text-lg text-zinc-400 group-hover:text-zinc-200"></ng-icon>
              <span class="text-sm font-medium">Chat Settings & Appearance</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-zinc-500 group-hover:text-zinc-300 text-sm"></ng-icon>
          </button>

          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-200 transition-colors group">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideFolder" class="text-lg text-zinc-400 group-hover:text-zinc-200"></ng-icon>
              <span class="text-sm font-medium">Chat Folders</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-zinc-500 group-hover:text-zinc-300 text-sm"></ng-icon>
          </button>

          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 text-zinc-200 transition-colors group">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideGlobe" class="text-lg text-zinc-400 group-hover:text-zinc-200"></ng-icon>
              <span class="text-sm font-medium">Language</span>
            </div>
            <span class="text-xs text-zinc-400">English</span>
          </button>
        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class SettingsDialogComponent {
  onLogout(ctx: any) {
    ctx.close();
    console.log('Logging out...');
  }
}
