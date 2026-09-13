import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideMoreVertical,
  lucideSettings,
  lucideBell,
  lucideLock,
  lucidePalette,
  lucideFolder,
  lucideGlobe,
  lucideChevronRight
} from '@ng-icons/lucide';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    HlmDialogImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideMoreVertical,
      lucideSettings,
      lucideBell,
      lucideLock,
      lucidePalette,
      lucideFolder,
      lucideGlobe,
      lucideChevronRight
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <!-- Modal Trigger Button -->
      <button hlmDialogTrigger
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-foreground/90 hover:bg-accent/60 transition-colors cursor-pointer">
        <ng-icon name="lucideSettings" class="text-xl text-muted-foreground shrink-0"></ng-icon>
        <span class="flex-1 text-left font-medium">Settings</span>
      </button>

      <!-- Main Dialog Content -->
      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-popover border border-border text-popover-foreground p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="relative flex items-center justify-between px-4 py-3 border-b border-border/70">
          <button 
            (click)="ctx.close()" 
            class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-lg block"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-foreground">
            Settings
          </h3>
          
          <button 
            class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ng-icon name="lucideMoreVertical" class="text-lg block"></ng-icon>
          </button>
        </div>

        <!-- Settings List Options -->
        <div class="p-2 space-y-0.5 text-left max-h-[60vh] overflow-y-auto custom-scrollbar">

          <!-- Notifications & Sounds -->
          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-accent/60 text-foreground transition-colors group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideBell" class="text-lg text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"></ng-icon>
              <span class="text-sm font-medium">Notifications and Sounds</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-muted-foreground/60 group-hover:text-foreground text-sm transition-colors"></ng-icon>
          </button>

          <!-- Privacy & Security -->
          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-accent/60 text-foreground transition-colors group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideLock" class="text-lg text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"></ng-icon>
              <span class="text-sm font-medium">Privacy and Security</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-muted-foreground/60 group-hover:text-foreground text-sm transition-colors"></ng-icon>
          </button>

          <!-- Chat Settings & Appearance -->
          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-accent/60 text-foreground transition-colors group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucidePalette" class="text-lg text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"></ng-icon>
              <span class="text-sm font-medium">Chat Settings & Appearance</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-muted-foreground/60 group-hover:text-foreground text-sm transition-colors"></ng-icon>
          </button>

          <!-- Chat Folders -->
          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-accent/60 text-foreground transition-colors group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideFolder" class="text-lg text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"></ng-icon>
              <span class="text-sm font-medium">Chat Folders</span>
            </div>
            <ng-icon name="lucideChevronRight" class="text-muted-foreground/60 group-hover:text-foreground text-sm transition-colors"></ng-icon>
          </button>

          <!-- Language -->
          <button class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-accent/60 text-foreground transition-colors group cursor-pointer">
            <div class="flex items-center gap-3.5">
              <ng-icon name="lucideGlobe" class="text-lg text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"></ng-icon>
              <span class="text-sm font-medium">Language</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-muted-foreground">English</span>
              <ng-icon name="lucideChevronRight" class="text-muted-foreground/60 group-hover:text-foreground text-sm transition-colors"></ng-icon>
            </div>
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
