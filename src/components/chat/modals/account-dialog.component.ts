import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
    lucideX,
    lucideMoreVertical,
    lucideCamera,
    lucideLogOut,
    lucideUser
} from '@ng-icons/lucide';

@Component({
    selector: 'app-account-settings',
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
            lucideLogOut,
            lucideUser
        })
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <hlm-dialog>
      <button hlmDialogTrigger
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer">
        <ng-icon name="lucideUser" class="text-lg text-zinc-400 dark:text-zinc-500 shrink-0"></ng-icon>
        <span class="flex-1 text-left">Account</span>
      </button>

      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl rounded-2xl select-none [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <button 
            type="button"
            (click)="ctx.close()" 
            class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-base"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">Account</h3>
          
          <button 
            type="button"
            class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon name="lucideMoreVertical" class="text-base"></ng-icon>
          </button>
        </div>

        <!-- User Profile Banner / Avatar Section -->
        <div class="relative px-5 pt-4 pb-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div class="flex items-center gap-3.5">
            <hlm-avatar class="size-13 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-800">
              <img hlmAvatarImage src="/avatar.png" alt="Parsa Nojavan" />
              <span hlmAvatarFallback class="font-bold text-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                PN
              </span>
            </hlm-avatar>
            <div class="flex flex-col">
              <span class="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Parsa Nojavan</span>
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            </div>
          </div>

          <!-- Change Avatar Button -->
          <button 
            type="button"
            title="Change Photo"
            class="absolute -bottom-3.5 right-5 size-8.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-md transition-all duration-150 active:scale-95 cursor-pointer">
            <ng-icon name="lucideCamera" class="text-sm"></ng-icon>
          </button>
        </div>

        <!-- Info List Rows -->
        <div class="p-2 space-y-0.5">
          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors duration-150">
            <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 tabular-nums" dir="ltr">+98 937 234 7173</div>
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Click to change phone number</div>
          </div>

          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors duration-150">
            <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">&#64;parsanojavan</div>
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Username</div>
          </div>

          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors duration-150">
            <div class="text-sm text-zinc-700 dark:text-zinc-300">Write something about yourself</div>
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Bio</div>
          </div>

          <!-- Log out Action -->
          <div class="pt-1.5 mt-1 border-t border-zinc-200 dark:border-zinc-800">
            <button 
              type="button"
              (click)="onLogout(ctx)"
              class="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors duration-150 text-sm font-medium cursor-pointer">
              <ng-icon name="lucideLogOut" class="text-base"></ng-icon>
              <span>Log out</span>
            </button>
          </div>
        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class AccountSettingsComponent {
    onLogout(ctx: any) {
        ctx.close();
        console.log('Logging out...');
    }
}
