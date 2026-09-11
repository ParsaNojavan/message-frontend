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
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-foreground/90 hover:bg-accent/60 transition-colors">
        <ng-icon name="lucideUser" class="text-xl text-muted-foreground shrink-0"></ng-icon>
        <span class="flex-1 text-left font-medium">Account</span>
      </button>

      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-[#1e1e1e] border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <div class="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/60">
          <button 
            (click)="ctx.close()" 
            class="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 p-1.5 rounded-lg transition-colors duration-150">
            <ng-icon name="lucideX" class="text-lg block"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-200">Account</h3>
          
          <button 
            class="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 p-1.5 rounded-lg transition-colors duration-150">
            <ng-icon name="lucideMoreVertical" class="text-lg block"></ng-icon>
          </button>
        </div>

        <div class="relative px-5 pt-4 pb-5 border-b border-zinc-800/60 flex items-center justify-between">
          <div class="flex items-center gap-3.5">
            <hlm-avatar class="size-12 ring-1 ring-zinc-700/60">
              <img hlmAvatarImage src="/avatar.png" alt="Parsa Nojavan" />
              <span hlmAvatarFallback class="font-medium text-sm bg-zinc-800 text-zinc-300">PN</span>
            </hlm-avatar>
            <div class="flex flex-col">
              <span class="font-medium text-sm text-zinc-100">Parsa Nojavan</span>
              <span class="text-xs text-zinc-400">Online</span>
            </div>
          </div>

          <button 
            title="Change Photo"
            class="absolute -bottom-3.5 right-5 size-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/70 text-zinc-300 hover:text-white flex items-center justify-center shadow-md transition-all duration-150 active:scale-95">
            <ng-icon name="lucideCamera" class="text-sm"></ng-icon>
          </button>
        </div>

        <div class="p-2 text-left space-y-0.5">
          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150">
            <div class="text-sm font-medium text-zinc-200" dir="ltr">+98 937 234 7173</div>
            <div class="text-[11px] text-zinc-400 mt-0.5">Click to change phone number</div>
          </div>

          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150">
            <div class="text-sm font-medium text-zinc-200">parsanojavan</div>
            <div class="text-[11px] text-zinc-400 mt-0.5">Username</div>
          </div>

          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/40 cursor-pointer transition-colors duration-150">
            <div class="text-sm text-zinc-300">Write something about yourself</div>
            <div class="text-[11px] text-zinc-400 mt-0.5">Bio</div>
          </div>

          <div class="pt-1.5 mt-1 border-t border-zinc-800/60">
            <button 
              (click)="onLogout(ctx)"
              class="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-150 text-sm font-medium">
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
