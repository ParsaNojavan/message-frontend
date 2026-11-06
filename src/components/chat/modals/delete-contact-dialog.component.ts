import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ContactsService } from '../../../services/chat/contacts.service';
import { lucideTrash2, lucideX, lucideAlertTriangle } from '@ng-icons/lucide';
import { Contact } from '../../../models/contact.model';

@Component({
    selector: 'app-delete-contact-dialog',
    standalone: true,
    imports: [
        CommonModule,
        HlmDialogImports,
        NgIconComponent
    ],
    providers: [
        provideIcons({
            lucideTrash2,
            lucideX,
            lucideAlertTriangle
        })
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <hlm-dialog>
      <!-- دکمه تریگر حذف روی هر ردیف مخاطب -->
      <button hlmDialogTrigger
        (click)="$event.stopPropagation()"
        title="Delete Contact"
        class="size-8 inline-flex items-center justify-center rounded-full hover:bg-red-100/70 dark:hover:bg-red-950/60 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer select-none">
        <ng-icon name="lucideTrash2" class="text-xs"></ng-icon>
      </button>

      <!-- محتوای مودال حذف -->
      <hlm-dialog-content *hlmDialogPortal="let ctx"
        class="w-[92vw] sm:max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl rounded-2xl select-none [&>button.absolute]:hidden">
        
        <!-- هدر مودال -->
        <div class="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <button 
            type="button"
            (click)="ctx.close()" 
            class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-base"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
            Delete Contact
          </h3>

          <div class="size-8"></div>
        </div>

        <!-- بدنه پیام تایید -->
        <div class="p-4 space-y-3">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ng-icon name="lucideAlertTriangle" class="text-lg"></ng-icon>
            </div>
            <div>
              <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Are you sure you want to delete <span class="font-semibold text-zinc-900 dark:text-zinc-100">{{ contactName() }}</span> from your contacts?
              </p>
            </div>
          </div>
        </div>

        <!-- دکمه‌های تایید یا لغو -->
        <div class="flex items-center justify-end gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            type="button" 
            (click)="ctx.close()"
            class="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer">
            Cancel
          </button>

          <button 
            type="button" 
            (click)="onConfirmDelete(ctx)"
            class="px-4 py-1.5 rounded-xl text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm active:scale-95 cursor-pointer">
            Delete
          </button>
        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class DeleteContactDialogComponent {
    private contactService = inject(ContactsService);

    contact = input.required<Contact>();
    contactDeleted = output<string>();

    contactName = computed(() => {
        const c = this.contact();
        const first = c.customFirstName || c.contactUser?.firstName || '';
        const last = c.customLastName || c.contactUser?.lastName || '';
        return `${first} ${last}`.trim() || 'this contact';
    });

    onConfirmDelete(ctx: any) {
        const contactUserId = this.contact().contactUserId || this.contact().contactUser?._id;
        if (!contactUserId) return;

        this.contactService.removeContact(contactUserId).subscribe({
            next: () => {
                this.contactDeleted.emit(contactUserId);
                ctx.close();
            },
            error: (err) => {
                console.error('خطا در حذف مخاطب:', err);
            }
        });
    }
}
