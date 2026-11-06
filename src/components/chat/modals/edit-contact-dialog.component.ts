import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ContactsService } from '../../../services/chat/contacts.service';
import { lucidePencil, lucideX, lucideUser } from '@ng-icons/lucide';
import { Contact } from '../../../models/contact.model';
import { EditContactDto } from '../../../models/dto/contact.dto';

@Component({
  selector: 'app-edit-contact-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmDialogImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucidePencil,
      lucideX,
      lucideUser
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <!-- دکمه تریگر ادیت روی هر ردیف مخاطب -->
      <button hlmDialogTrigger
        (click)="$event.stopPropagation()"
        title="Edit Contact"
        class="size-8 inline-flex items-center justify-center rounded-full hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer select-none">
        <ng-icon name="lucidePencil" class="text-xs"></ng-icon>
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
            Edit Contact
          </h3>

          <div class="size-8"></div>
        </div>

        <!-- فرم ویرایش اطلاعات -->
        <form (ngSubmit)="onSubmit(ctx)" class="p-4 space-y-4">
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
                  placeholder="First name"
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
                placeholder="Last name"
                class="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors" />
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
              [disabled]="!firstName().trim() && !lastName().trim()"
              class="px-4 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm active:scale-95 cursor-pointer">
              Save
            </button>
          </div>
        </form>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class EditContactDialogComponent {
  private contactService = inject(ContactsService);

  contact = input.required<Contact>();
  contactUpdated = output<Contact>();

  firstName = signal('');
  lastName = signal('');

  constructor() {
    effect(() => {
      const c = this.contact();
      if (c) {
        this.firstName.set(c.customFirstName || c.contactUser?.firstName || '');
        this.lastName.set(c.customLastName || c.contactUser?.lastName || '');
      }
    });
  }

  onSubmit(ctx: any) {
    const contactUserId = this.contact().contactUserId || this.contact().contactUser?._id;
    if (!contactUserId) return;

    const dto: EditContactDto = {
      customFirstName: this.firstName().trim(),
      customLastName: this.lastName().trim()
    };

    this.contactService.editContact(contactUserId, dto).subscribe({
      next: (res) => {
        this.contactUpdated.emit(res?.data ?? res);
        ctx.close();
      },
      error: (err) => {
        console.error('خطا در ویرایش مخاطب:', err);
      }
    });
  }
}
