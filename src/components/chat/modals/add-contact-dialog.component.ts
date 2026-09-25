import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ContactsService } from '../../../services/chat/contacts.service';
import {
  lucideUserPlus,
  lucideX,
  lucideUser,
  lucidePhone,
  lucideAtSign
} from '@ng-icons/lucide';
import { AddContactDto } from '../../../models/dto/contact.dto';

export interface NewContactData {
  firstName: string;
  lastName: string;
  phoneOrUsername: string;
  online: boolean;
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
        class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer select-none">
        <ng-icon name="lucideUserPlus" class="text-sm"></ng-icon>
        <span>Add Contact</span>
      </button>

      <!-- محتوای مودال -->
      <hlm-dialog-content *hlmDialogPortal="let ctx"
        class="w-[92vw] sm:max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl rounded-2xl select-none [&>button.absolute]:hidden">
        
        <!-- هدر مودال -->
        <div class="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <button 
            type="button"
            (click)="ctx.close()" 
            class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-base"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
            New Contact
          </h3>

          <div class="size-8"></div> <!-- بالانسر متقارن هدر -->
        </div>

        <!-- فرم دریافت اطلاعات مخاطب -->
        <form (ngSubmit)="onSubmit(ctx)" class="p-4 space-y-4">
          <!-- نام و نام خانوادگی -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-600 dark:text-zinc-400">First Name</label>
              <div class="relative flex items-center">
                <span class="absolute left-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none text-sm">
                  <ng-icon name="lucideUser"></ng-icon>
                </span>
                <input 
                  type="text" 
                  [ngModel]="firstName()" 
                  (ngModelChange)="firstName.set($event)"
                  name="firstName" 
                  required 
                  placeholder="Parsa"
                  class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-600 dark:text-zinc-400">Last Name</label>
              <input 
                type="text" 
                [ngModel]="lastName()" 
                (ngModelChange)="lastName.set($event)"
                name="lastName" 
                placeholder="Nojavan"
                class="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors" />
            </div>
          </div>

          <!-- شماره تماس یا نام کاربری -->
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-zinc-600 dark:text-zinc-400">Phone number or Username</label>
            <div class="relative flex items-center">
              <span class="absolute left-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none text-sm">
                <ng-icon name="lucidePhone"></ng-icon>
              </span>
              <input 
                type="text" 
                [ngModel]="phoneOrUsername()" 
                (ngModelChange)="phoneOrUsername.set($event)"
                name="phoneOrUsername" 
                required 
                dir="ltr"
                placeholder="+98 912 ... or @username"
                class="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors font-mono" />
            </div>
          </div>

          <!-- فوتر دیالوگ -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button 
              type="button" 
              (click)="ctx.close()"
              class="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer">
              Cancel
            </button>

            <button 
              type="submit" 
              [disabled]="!firstName().trim() || !phoneOrUsername().trim()"
              class="px-4 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm active:scale-95 cursor-pointer">
              Done
            </button>
          </div>
        </form>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class AddContactDialogComponent {

  contactService = inject(ContactsService);

  firstName = signal('');
  lastName = signal('');
  phoneOrUsername = signal('');

  contactAdded = output<NewContactData>();

  onSubmit(ctx: any) {
    if (!this.firstName().trim() || !this.phoneOrUsername().trim()) return;

    const dto: AddContactDto = {
      query: this.phoneOrUsername().trim(),
      customFirstName: this.firstName().trim(),
      customLastName: this.lastName().trim(),
    };

    this.contactService.addContact(dto).subscribe({
      next: () => {
        this.contactAdded.emit({
          firstName: this.firstName().trim(),
          lastName: this.lastName().trim(),
          phoneOrUsername: this.phoneOrUsername().trim(),
          online: true
        });
        this.resetForm();
        ctx.close();
      },
      error: (err) => {
        console.error('خطا در ثبت مخاطب:', err);
      }
    });
  }

  resetForm() {
    this.firstName.set('');
    this.lastName.set('');
    this.phoneOrUsername.set('');
  }
}
