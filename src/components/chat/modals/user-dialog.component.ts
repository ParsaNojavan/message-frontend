import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
    computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
    lucideX,
    lucideMoreVertical,
    lucideMessageSquare,
    lucidePhone,
    lucideBell,
    lucideImage,
    lucideFilm,
    lucideFileText,
    lucideUsers,
    lucideCheck,
    lucideCopy,
    lucidePlay
} from '@ng-icons/lucide';

export type TabType = 'photos' | 'videos' | 'files' | 'groups';

export interface UserProfileData {
    name: string;
    phone?: string;
    avatar?: string;
    avatarColor?: string;
    isOnline?: boolean;
    lastSeen?: string;
    notificationsEnabled?: boolean;
}

export interface VideoItem {
    thumbnail: string;
    duration?: string;
}

export interface FileItem {
    name: string;
    size: string;
}

export interface GroupItem {
    name: string;
    membersCount: number;
}

@Component({
    selector: 'app-user-profile-modal',
    standalone: true,
    imports: [
        CommonModule,
        HlmDialogImports,
        HlmAvatarImports,
        NgIconComponent,
    ],
    providers: [
        provideIcons({
            lucideX,
            lucideMoreVertical,
            lucideMessageSquare,
            lucidePhone,
            lucideBell,
            lucideImage,
            lucideFilm,
            lucideFileText,
            lucideUsers,
            lucideCheck,
            lucideCopy,
            lucidePlay
        })
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <hlm-dialog>
      <!-- Trigger -->
      <button 
        hlmDialogTrigger 
        type="button"
        class="flex items-center gap-3 text-left group cursor-pointer focus:outline-none select-none p-1 rounded-lg">
        <hlm-avatar class="size-10 shrink-0">
          <img *ngIf="user?.avatar" hlmAvatarImage [src]="user.avatar" [alt]="user.name" />
          <span hlmAvatarFallback [class]="user?.avatarColor || 'bg-red-600'" class="text-white font-bold text-sm">
            {{ getInitials(user?.name) }}
          </span>
        </hlm-avatar>

        <div class="flex flex-col min-w-0">
          <h3 class="text-sm font-semibold text-zinc-100">
            {{ user?.name }}
          </h3>
          <span class="text-[11px] text-zinc-400 truncate">
            {{ user?.isOnline ? 'online' : (user?.lastSeen || 'last seen recently') }}
          </span>
        </div>
      </button>

      <hlm-dialog-content
        *hlmDialogPortal="let ctx"
        class="!w-[95vw] !max-w-lg !h-[580px] !min-h-[580px] !max-h-[580px] !p-0 !rounded-2xl !border !border-zinc-800 bg-[#1e1e1e] text-zinc-100 shadow-2xl !flex !flex-col overflow-hidden [&>button.absolute]:hidden">
        
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/80 shrink-0 bg-[#1e1e1e]">
          <button 
            type="button"
            (click)="ctx.close()"
            title="Close"
            class="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg transition cursor-pointer">
            <ng-icon name="lucideX" class="text-xl block"></ng-icon>
          </button>

          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-200">User Info</h3>

          <button 
            type="button"
            title="Options"
            class="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg transition cursor-pointer">
            <ng-icon name="lucideMoreVertical" class="text-xl block"></ng-icon>
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div class="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/20 shrink-0">
            <div class="flex items-center gap-4 min-w-0">
              <hlm-avatar class="size-16 ring-2 ring-red-500/20 shrink-0">
                <img *ngIf="user?.avatar" hlmAvatarImage [src]="user.avatar" [alt]="user.name" />
                <span hlmAvatarFallback [class]="user?.avatarColor || 'bg-red-600'" class="font-bold text-2xl text-white">
                  {{ getInitials(user?.name) }}
                </span>
              </hlm-avatar>

              <div class="flex flex-col min-w-0">
                <span class="font-bold text-lg text-zinc-100 leading-snug truncate">
                  {{ user?.name }}
                </span>
                <span class="text-xs text-zinc-400 mt-1 truncate">
                  {{ user?.isOnline ? 'Online' : (user?.lastSeen || 'Last seen recently') }}
                </span>
              </div>
            </div>

            <button 
              type="button"
              (click)="onStartChat(ctx)"
              title="Start Chat"
              class="size-11 rounded-full bg-zinc-800/90 hover:bg-red-600/20 text-red-500 hover:text-red-400 flex items-center justify-center transition active:scale-95 border border-red-500/30 cursor-pointer shrink-0 shadow-sm">
              <ng-icon name="lucideMessageSquare" class="text-xl"></ng-icon>
            </button>
          </div>

          <div class="p-3 border-b border-zinc-800/80 space-y-1 shrink-0">
            <div 
              *ngIf="user?.phone"
              (click)="copyPhone(user?.phone)"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 transition cursor-pointer group">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-red-400 transition-colors">
                  <ng-icon name="lucidePhone" class="text-lg"></ng-icon>
                </div>
                <div>
                  <div class="text-sm font-medium text-zinc-200 group-hover:text-red-400 transition" dir="ltr">
                    {{ user?.phone }}
                  </div>
                  <div class="text-[11px] text-zinc-400 mt-0.5">Phone</div>
                </div>
              </div>

              <span class="text-xs text-zinc-500 group-hover:opacity-100 transition flex items-center gap-1">
                <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideCopy'" class="text-base" [class.text-emerald-500]="copied()"></ng-icon>
              </span>
            </div>

            <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-800/50 transition">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                  <ng-icon name="lucideBell" class="text-lg"></ng-icon>
                </div>
                <div>
                  <div class="text-sm font-medium text-zinc-200">Notifications</div>
                  <div class="text-[11px] text-zinc-400 mt-0.5">{{ isNotificationsOn() ? 'On' : 'Off' }}</div>
                </div>
              </div>

              <button 
                type="button"
                (click)="toggleNotifications()"
                [class.bg-red-600]="isNotificationsOn()"
                [class.bg-zinc-700]="!isNotificationsOn()"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none">
                <span 
                    [class.translate-x-6]="isNotificationsOn()"
                    [class.translate-x-1]="!isNotificationsOn()"
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out">
                </span>
              </button>

            </div>
          </div>

          <div class="flex items-center justify-around border-b border-zinc-800/80 text-xs font-medium text-zinc-400 bg-zinc-900/40 sticky top-0 z-10 backdrop-blur-sm px-2 shrink-0">
            <button 
              *ngFor="let tab of tabs"
              type="button"
              (click)="activeTab.set(tab.id)"
              [class.text-red-500]="activeTab() === tab.id"
              [class.border-red-500]="activeTab() === tab.id"
              class="py-3 px-3 border-b-2 border-transparent transition-colors hover:text-zinc-200 cursor-pointer uppercase flex items-center gap-1.5 font-semibold text-[11px] tracking-wider">
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <div class="p-4 flex-1 min-h-[220px] flex flex-col">
            <!-- Photos -->
            <div *ngIf="activeTab() === 'photos'" class="flex-1 flex flex-col">
              <div *ngIf="photos.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                <div 
                  *ngFor="let photo of photos"
                  class="aspect-square bg-zinc-800 rounded-xl overflow-hidden group relative cursor-pointer ring-1 ring-zinc-800 hover:ring-red-500/50 transition">
                  <img 
                    [src]="photo"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    alt="Shared photo"
                  />
                </div>
              </div>
              <div *ngIf="photos.length === 0" class="flex-1 flex items-center justify-center text-xs text-zinc-500 py-8">
                No shared photos
              </div>
            </div>

            <div *ngIf="activeTab() === 'videos'" class="flex-1 flex flex-col">
              <div *ngIf="videos.length > 0" class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                <div *ngFor="let video of videos" class="aspect-square bg-zinc-800 rounded-xl overflow-hidden relative cursor-pointer group">
                  <img [src]="video.thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition duration-200" alt="Video thumbnail" />
                  <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <ng-icon name="lucidePlay" class="text-white text-xl"></ng-icon>
                  </div>
                  <span class="absolute bottom-1.5 right-1.5 bg-black/70 text-[10px] px-1.5 py-0.5 rounded text-zinc-200">
                    {{ video.duration || '0:00' }}
                  </span>
                </div>
              </div>
              <div *ngIf="videos.length === 0" class="flex-1 flex items-center justify-center text-xs text-zinc-500 py-8">
                No shared videos
              </div>
            </div>

            <!-- Files -->
            <div *ngIf="activeTab() === 'files'" class="flex-1 flex flex-col">
              <div *ngIf="files.length > 0" class="space-y-2">
                <div *ngFor="let file of files" class="flex items-center gap-3 p-2.5 bg-zinc-800/40 rounded-xl hover:bg-zinc-800/70 cursor-pointer transition">
                  <ng-icon name="lucideFileText" class="text-red-400 text-xl"></ng-icon>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-zinc-200 truncate">{{ file.name }}</p>
                    <span class="text-[10px] text-zinc-400">{{ file.size }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="files.length === 0" class="flex-1 flex items-center justify-center text-xs text-zinc-500 py-8">
                No shared files
              </div>
            </div>

            <!-- Groups -->
            <div *ngIf="activeTab() === 'groups'" class="flex-1 flex flex-col">
              <div *ngIf="groups.length > 0" class="space-y-2">
                <div *ngFor="let group of groups" class="flex items-center gap-3 p-2.5 bg-zinc-800/40 rounded-xl hover:bg-zinc-800/70 cursor-pointer transition">
                  <hlm-avatar class="size-8">
                    <span hlmAvatarFallback class="bg-zinc-700 text-xs text-white">
                      {{ getInitials(group.name) }}
                    </span>
                  </hlm-avatar>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-zinc-200 truncate">{{ group.name }}</p>
                    <span class="text-[10px] text-zinc-400">{{ group.membersCount }} members</span>
                  </div>
                </div>
              </div>
              <div *ngIf="groups.length === 0" class="flex-1 flex items-center justify-center text-xs text-zinc-500 py-8">
                No common groups
              </div>
            </div>
          </div>

        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class UserProfileModalComponent {
    @Input({ required: true }) user: UserProfileData = {
        name: 'Mom',
        phone: '+98 914 419 0723',
        isOnline: false,
        lastSeen: 'last seen Wednesday at 18:00',
        notificationsEnabled: true,
        avatarColor: 'bg-red-600'
    };

    @Input() photos: string[] = [
        'https://picsum.photos/300/300?random=11',
        'https://picsum.photos/300/300?random=12',
        'https://picsum.photos/300/300?random=13'
    ];
    @Input() videos: VideoItem[] = [];
    @Input() files: FileItem[] = [];
    @Input() groups: GroupItem[] = [];

    @Output() chatClicked = new EventEmitter<void>();
    @Output() notificationsToggled = new EventEmitter<boolean>();

    readonly activeTab = signal<TabType>('photos');
    readonly copied = signal(false);

    private readonly internalNotifications = signal<boolean | null>(null);

    readonly isNotificationsOn = computed(() => {
        const internal = this.internalNotifications();
        return internal !== null ? internal : (this.user?.notificationsEnabled ?? true);
    });

    get tabs(): { id: TabType; label: string; count: number }[] {
        return [
            { id: 'photos', label: 'Photos', count: this.photos.length },
            { id: 'videos', label: 'Videos', count: this.videos.length },
            { id: 'files', label: 'Files', count: this.files.length },
            { id: 'groups', label: 'Groups', count: this.groups.length }
        ];
    }

    toggleNotifications(): void {
        const nextState = !this.isNotificationsOn();
        this.internalNotifications.set(nextState);
        this.notificationsToggled.emit(nextState);
    }

    onStartChat(ctx: any): void {
        this.chatClicked.emit();
        ctx.close();
    }

    copyPhone(phone?: string): void {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
    }

    getInitials(name?: string): string {
        if (!name) return 'U';
        return name
            .trim()
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 1);
    }
}
