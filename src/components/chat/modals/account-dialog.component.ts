import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideCamera,
  lucideLogOut,
  lucideUser,
  lucidePencil,
  lucideCheck,
  lucideLoader2
} from '@ng-icons/lucide';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmDialogImports,
    HlmAvatarImports,
    HlmInputImports,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideCamera,
      lucideLogOut,
      lucideUser,
      lucidePencil,
      lucideCheck,
      lucideLoader2
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog>
      <button hlmDialogTrigger
        class="w-full flex items-center gap-4 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer">
        <ng-icon name="lucideUser" class="text-lg text-zinc-400 dark:text-zinc-500 shrink-0"></ng-icon>
        <span class="flex-1 text-left font-medium">Account</span>
      </button>

      <hlm-dialog-content *hlmDialogPortal="let ctx" 
        class="w-[92vw] sm:max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl rounded-2xl select-none [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <button 
            type="button"
            (click)="ctx.close(); cancelEditing()" 
            class="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-base"></ng-icon>
          </button>
          
          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
            {{ isEditing() ? 'Edit Profile' : 'Account' }}
          </h3>
          
          <!-- Edit / Toggle Button -->
          <button 
            type="button"
            (click)="toggleEditMode()"
            [title]="isEditing() ? 'Cancel' : 'Edit Profile'"
            class="size-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <ng-icon [name]="isEditing() ? 'lucideX' : 'lucidePencil'" class="text-sm"></ng-icon>
          </button>
        </div>

        <!-- User Profile Banner / Avatar Section -->
        <div class="relative px-5 pt-4 pb-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div class="flex items-center gap-3.5">
            <hlm-avatar class="size-14 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-800 shadow-xs">
              <img *ngIf="avatarPreview() || user()?.avatar" hlmAvatarImage [src]="avatarPreview() || user()?.avatar" [alt]="displayName()" />
              <span hlmAvatarFallback class="font-bold text-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                {{ initials() }}
              </span>
            </hlm-avatar>
            <div class="flex flex-col">
              <span class="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {{ displayName() }}
              </span>
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            </div>
          </div>

          <!-- Hidden File Input for Avatar Upload -->
          <input #fileInput type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)" />

          <!-- Change Avatar Button -->
          <button 
            type="button"
            (click)="fileInput.click()"
            title="Change Photo"
            class="absolute -bottom-3.5 right-5 size-8.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-md transition-all duration-150 active:scale-95 cursor-pointer">
            <ng-icon name="lucideCamera" class="text-sm"></ng-icon>
          </button>
        </div>

        <!-- ================= VIEW MODE ================= -->
        <div *ngIf="!isEditing()" class="p-2 space-y-0.5">
          <!-- Phone Number -->
          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors duration-150">
            <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 tabular-nums" dir="ltr">
              {{ user()?.phoneNumber || 'No phone number' }}
            </div>
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Phone Number</div>
          </div>

          <!-- Username -->
          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors duration-150">
            <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <ng-container *ngIf="user()?.username; else noUsername">
                &#64;{{ user()?.username }}
              </ng-container>
              <ng-template #noUsername>
                <span class="text-zinc-400 dark:text-zinc-500 italic">None</span>
              </ng-template>
            </div>
            <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Username</div>
          </div>

          <!-- Bio -->
          <div class="px-3.5 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors duration-150">
            <div class="text-sm text-zinc-700 dark:text-zinc-300">
              {{ user()?.bio || 'Write something about yourself' }}
            </div>
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

        <!-- ================= EDIT MODE ================= -->
        <div *ngIf="isEditing()" class="p-4 space-y-3.5">
          <!-- First & Last Name -->
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">First Name</label>
              <input 
                hlmInput 
                [(ngModel)]="editFirstName"
                placeholder="First name"
                class="w-full text-xs h-9" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Last Name</label>
              <input 
                hlmInput 
                [(ngModel)]="editLastName"
                placeholder="Last name"
                class="w-full text-xs h-9" />
            </div>
          </div>

          <!-- Username -->
          <div>
            <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Username</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-xs text-zinc-400 font-mono">&#64;</span>
              <input 
                hlmInput 
                [(ngModel)]="editUsername"
                placeholder="username"
                class="w-full text-xs h-9 pl-6 font-mono" />
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">Bio</label>
            <textarea 
              [(ngModel)]="editBio"
              rows="3"
              maxlength="120"
              placeholder="Tell us a little bit about yourself..."
              class="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"></textarea>
            <span class="text-[10px] text-zinc-400 dark:text-zinc-500 text-right block">{{ (editBio || '').length }}/120</span>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
            {{ errorMessage() }}
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button 
              type="button"
              (click)="cancelEditing()"
              [disabled]="saving()"
              class="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              Cancel
            </button>

            <button 
              type="button"
              (click)="saveProfile()"
              [disabled]="saving()"
              class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
              <ng-icon *ngIf="saving()" name="lucideLoader2" class="animate-spin text-xs"></ng-icon>
              <ng-icon *ngIf="!saving()" name="lucideCheck" class="text-xs"></ng-icon>
              <span>{{ saving() ? 'Saving...' : 'Save' }}</span>
            </button>
          </div>
        </div>

      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class AccountSettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.userProfile;

  // وضعیت ویرایش و فرم
  isEditing = signal<boolean>(false);
  saving = signal<boolean>(false);
  errorMessage = signal<string>('');
  avatarPreview = signal<string | null>(null);

  editFirstName: string = '';
  editLastName: string = '';
  editUsername: string = '';
  editBio: string = '';
  selectedAvatarData: string | null = null;

  readonly displayName = computed(() => {
    const profile = this.user();
    if (!profile) return 'User';
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.username || profile.phoneNumber || 'User';
  });

  readonly initials = computed(() => {
    const profile = this.user();
    if (!profile) return 'U';

    if (profile.firstName || profile.lastName) {
      const f = profile.firstName ? profile.firstName.charAt(0) : '';
      const l = profile.lastName ? profile.lastName.charAt(0) : '';
      return `${f}${l}`.toUpperCase() || 'U';
    }

    if (profile.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }

    return 'U';
  });

  ngOnInit(): void {
    if (!this.user()) {
      this.authService.getUserProfile().subscribe({
        error: (err) => console.error('Failed to load profile in account settings:', err)
      });
    }
  }

  toggleEditMode(): void {
    if (!this.isEditing()) {
      this.populateForm();
      this.isEditing.set(true);
    } else {
      this.cancelEditing();
    }
  }

  populateForm(): void {
    const profile = this.user();
    this.editFirstName = profile?.firstName || '';
    this.editLastName = profile?.lastName || '';
    this.editUsername = profile?.username || '';
    this.editBio = profile?.bio || '';
    this.errorMessage.set('');
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.avatarPreview.set(null);
    this.selectedAvatarData = null;
    this.errorMessage.set('');
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // محدودیت حجم (مثلاً حداکثر 3 مگابایت)
      if (file.size > 3 * 1024 * 1024) {
        this.errorMessage.set('Image size should be less than 3MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.avatarPreview.set(base64);
        this.selectedAvatarData = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    this.saving.set(true);
    this.errorMessage.set('');

    const payload: Record<string, any> = {
      firstName: this.editFirstName.trim(),
      lastName: this.editLastName.trim(),
      username: this.editUsername.trim().replace(/^@/, ''), // حذف @ در صورت درج کاربر
      bio: this.editBio.trim()
    };

    if (this.selectedAvatarData) {
      payload['avatar'] = this.selectedAvatarData;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.isEditing.set(false);
        this.avatarPreview.set(null);
        this.selectedAvatarData = null;
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }

  onLogout(ctx: any): void {
    ctx.close();
    this.authService.logout();
  }
}
