import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideUserPlus,
  lucideX,
  lucideUser,
  lucidePhone,
  lucideAtSign
} from '@ng-icons/lucide';

export interface NewContactData {
  firstName: string;
  lastName: string;
  phoneOrUsername: string;
  online: boolean
}

@Component({
  selector: 'app-add-contact-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmDialogImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideUserPlus,
      lucideX,
      lucideUser,
      lucidePhone,
      lucideAtSign
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <!-- دکمه تریگر دیالوگ -->
      <button hlmDialogTrigger
        class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer">
        <ng-icon name="lucideUserPlus" class="text-sm"></ng-icon>
        <span>Add Contact</span>
      </button>

      <!-- محتوای مودال هماهنگ با الگوی Portal -->
      <hlm-dialog-content *hlmDialogPortal="let ctx"
        class="w-[92vw] sm:max-w-md bg-popover text-popover-foreground border border-border p-0 overflow-hidden shadow-2xl rounded-2xl [&>button.absolute]:hidden">
        
        <!-- هدر مودال -->
        <div class="flex items-center justify-between px-3.5 py-3 border-b border-border/60">
          <button 
            type="button"
            (click)="ctx.close()" 
            class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-lg block"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-foreground">
            New Contact
          </h3>

          <div class="w-5"></div> <!-- بالانسر هدر -->
        </div>

        <!-- فرم دریافت اطلاعات مخاطب -->
        <form (ngSubmit)="onSubmit(ctx)" class="p-4 space-y-3.5">
          <!-- نام و نام خانوادگی -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground">First Name</label>
              <div class="relative flex items-center">
                <span class="absolute left-2.5 text-muted-foreground/70 pointer-events-none text-sm">
                  <ng-icon name="lucideUser"></ng-icon>
                </span>
                <input 
                  type="text" 
                  [ngModel]="firstName()" 
                  (ngModelChange)="firstName.set($event)"
                  name="firstName" 
                  required 
                  placeholder="Parsa"
                  class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-accent/40 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-colors" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-muted-foreground">Last Name</label>
              <input 
                type="text" 
                [ngModel]="lastName()" 
                (ngModelChange)="lastName.set($event)"
                name="lastName" 
                placeholder="Nojavan"
                class="w-full px-3 py-2 text-xs rounded-xl bg-accent/40 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-colors" />
            </div>
          </div>

          <!-- شماره تماس یا نام کاربری -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-muted-foreground">Phone number or Username</label>
            <div class="relative flex items-center">
              <span class="absolute left-2.5 text-muted-foreground/70 pointer-events-none text-sm">
                <ng-icon name="lucidePhone"></ng-icon>
              </span>
              <input 
                type="text" 
                [ngModel]="phoneOrUsername()" 
                (ngModelChange)="phoneOrUsername.set($event)"
                name="phoneOrUsername" 
                required 
                placeholder="+98 912 ... or @username"
                class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-accent/40 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-colors" />
            </div>
          </div>

          <!-- فوتر دیالوگ -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button 
              type="button" 
              (click)="ctx.close()"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer">
              Cancel
            </button>

            <button 
              type="submit" 
              [disabled]="!firstName().trim() || !phoneOrUsername().trim()"
              class="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm cursor-pointer">
              Done
            </button>
          </div>
        </form>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class AddContactDialogComponent {
  firstName = signal('');
  lastName = signal('');
  phoneOrUsername = signal('');

  contactAdded = output<NewContactData>();

  onSubmit(ctx: any) {
    if (!this.firstName().trim() || !this.phoneOrUsername().trim()) return;

    this.contactAdded.emit({
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      phoneOrUsername: this.phoneOrUsername().trim(),
      online: true
    });

    this.firstName.set('');
    this.lastName.set('');
    this.phoneOrUsername.set('');
    ctx.close();
  }
}
