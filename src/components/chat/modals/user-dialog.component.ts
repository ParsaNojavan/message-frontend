import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnChanges,
  SimpleChanges
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
  lucidePlay,
  lucideInfo,
  lucideLoader2
} from '@ng-icons/lucide';
import { GroupService, GroupItem } from '../../../services/chat/group.service';

export type TabType = 'photos' | 'videos' | 'files' | 'groups';

export interface UserProfileData {
  id?: string;
  name: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  avatarColor?: string;
  isOnline?: boolean;
  lastSeen?: string;
  notificationsEnabled?: boolean;
}

export interface VideoItem {
  thumbnail: string;
  url?: string;
  duration?: string;
}

export interface FileItem {
  name: string;
  size?: string;
  url?: string;
}

export interface CommonGroupResponseItem {
  _id: string;
  name: string;
  avatar?: string | null;
  type: string;
  createdAt?: string;
  updatedAt?: string;
  membersCount?: number;
}

export interface CommonGroupsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: CommonGroupResponseItem[];
    nextCursor: string | null;
  };
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
      lucidePlay,
      lucideInfo,
      lucideLoader2
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
          @if (user.avatar) {
            <img hlmAvatarImage [src]="user.avatar" [alt]="user.name" />
          }
          <span hlmAvatarFallback [class]="user.avatarColor || 'bg-emerald-600 text-white'" class="font-bold text-sm">
            {{ getInitials(user.name) }}
          </span>
        </hlm-avatar>

        <div class="flex flex-col min-w-0">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ user.name }}
          </h3>
          <span class="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            {{ user.isOnline ? 'online' : (user.lastSeen || 'last seen recently') }}
          </span>
        </div>
      </button>

      <!-- Modal Content -->
      <hlm-dialog-content
        *hlmDialogPortal="let ctx"
        class="!w-[95vw] !max-w-lg !h-[580px] !min-h-[580px] !max-h-[580px] !p-0 !rounded-2xl !border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl !flex !flex-col overflow-hidden [&>button.absolute]:hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200/70 dark:border-zinc-800/70 shrink-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <button 
            type="button"
            (click)="ctx.close()"
            title="Close"
            class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <ng-icon name="lucideX" class="text-xl block"></ng-icon>
          </button>

          <h3 hlmDialogTitle class="text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">User Info</h3>

          <button 
            type="button"
            title="Options"
            class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <ng-icon name="lucideMoreVertical" class="text-xl block"></ng-icon>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 min-h-0 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <!-- User Profile Hero -->
          <div class="px-6 py-5 border-b border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20 shrink-0">
            <div class="flex items-center gap-4 min-w-0">
              <hlm-avatar class="size-16 ring-2 ring-emerald-500/20 shrink-0">
                @if (user.avatar) {
                  <img hlmAvatarImage [src]="user.avatar" [alt]="user.name" />
                }
                <span hlmAvatarFallback [class]="user.avatarColor || 'bg-emerald-600 text-white'" class="font-bold text-2xl">
                  {{ getInitials(user.name) }}
                </span>
              </hlm-avatar>

              <div class="flex flex-col min-w-0">
                <span class="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-snug truncate">
                  {{ user.name }}
                </span>
                <span class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  {{ user.isOnline ? 'Online' : (user.lastSeen || 'Last seen recently') }}
                </span>
              </div>
            </div>

            <button 
              type="button"
              (click)="onStartChat(ctx)"
              title="Start Chat"
              class="size-11 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition active:scale-95 border border-emerald-500/30 cursor-pointer shrink-0 shadow-sm">
              <ng-icon name="lucideMessageSquare" class="text-xl"></ng-icon>
            </button>
          </div>

          <!-- Contact Details & Settings -->
          <div class="p-3 border-b border-zinc-200/70 dark:border-zinc-800/70 space-y-1 shrink-0">
            @if (user.phone) {
              <div 
                (click)="copyPhone(user.phone)"
                class="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <ng-icon name="lucidePhone" class="text-lg"></ng-icon>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" dir="ltr">
                      {{ user.phone }}
                    </div>
                    <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Phone</div>
                  </div>
                </div>

                <span class="text-xs text-zinc-500 dark:text-zinc-400 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <ng-icon [name]="copiedPhone() ? 'lucideCheck' : 'lucideCopy'" class="text-base" [class.text-emerald-600]="copiedPhone()" [class.dark:text-emerald-400]="copiedPhone()"></ng-icon>
                </span>
              </div>
            }

            <!-- Notifications / Mute Toggle -->
            <div class="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <ng-icon name="lucideBell" class="text-lg"></ng-icon>
                </div>
                <div>
                  <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Notifications</div>
                  <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{{ isMuted ? 'Muted' : 'Unmuted' }}</div>
                </div>
              </div>

              <button 
                type="button"
                role="switch"
                [attr.aria-checked]="isMuted"
                (click)="toggleNotifications()"
                [class.bg-emerald-600]="isMuted"
                [class.bg-zinc-200]="!isMuted"
                [class.dark:bg-zinc-700]="!isMuted"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none">
                <span 
                  [class.translate-x-6]="isMuted"
                  [class.translate-x-1]="!isMuted"
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out">
                </span>
              </button>
            </div>

            <!-- Bio Section -->
            @if (user.bio) {
              <div 
                (click)="copyBio(user.bio)"
                class="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors group">
                <div class="flex items-center gap-3 min-w-0 pr-2">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                    <ng-icon name="lucideInfo" class="text-lg"></ng-icon>
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 break-words transition-colors">
                      {{ user.bio }}
                    </div>
                    <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Bio</div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Tabs Navigation -->
          <div class="flex items-center justify-around border-b border-zinc-200/70 dark:border-zinc-800/70 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-white/40 dark:bg-zinc-900/40 sticky top-0 z-10 backdrop-blur-sm px-2 shrink-0">
            @for (tab of tabs; track tab.id) {
              <button 
                type="button"
                (click)="setTab(tab.id)"
                [class.text-emerald-600]="activeTab() === tab.id"
                [class.dark:text-emerald-400]="activeTab() === tab.id"
                [class.border-emerald-600]="activeTab() === tab.id"
                [class.dark:border-emerald-400]="activeTab() === tab.id"
                class="py-3 px-3 border-b-2 border-transparent transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer uppercase flex items-center gap-1.5 font-semibold text-[11px] tracking-wider">
                <span>{{ tab.label }}</span>
                @if (tab.id === 'groups' && groups().length > 0) {
                  <span class="text-[10px] opacity-75">({{ groups().length }})</span>
                }
              </button>
            }
          </div>

          <!-- Tab Panels Area -->
          <div class="p-4 flex-1 min-h-[220px] flex flex-col">
            <!-- Photos -->
            @if (activeTab() === 'photos') {
              <div class="flex-1 flex flex-col">
                @if (photos.length > 0) {
                  <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    @for (photo of photos; track $index) {
                      <div class="aspect-square bg-zinc-100 dark:bg-zinc-800/60 rounded-xl overflow-hidden group relative cursor-pointer ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-emerald-500/50 transition">
                        <img 
                          [src]="photo"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          alt="Shared photo"
                        />
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex-1 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 py-8">
                    No shared photos
                  </div>
                }
              </div>
            }

            <!-- Videos -->
            @if (activeTab() === 'videos') {
              <div class="flex-1 flex flex-col">
                @if (videos.length > 0) {
                  <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    @for (video of videos; track $index) {
                      <div class="aspect-square bg-zinc-100 dark:bg-zinc-800/60 rounded-xl overflow-hidden relative cursor-pointer group">
                        <img [src]="video.thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition duration-200" alt="Video thumbnail" />
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <ng-icon name="lucidePlay" class="text-white text-xl"></ng-icon>
                        </div>
                        <span class="absolute bottom-1.5 right-1.5 bg-black/70 text-[10px] px-1.5 py-0.5 rounded text-white">
                          {{ video.duration || '0:00' }}
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex-1 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 py-8">
                    No shared videos
                  </div>
                }
              </div>
            }

            <!-- Files -->
            @if (activeTab() === 'files') {
              <div class="flex-1 flex flex-col">
                @if (files.length > 0) {
                  <div class="space-y-2">
                    @for (file of files; track file.name) {
                      <div class="flex items-center gap-3 p-2.5 bg-zinc-100/60 dark:bg-zinc-800/40 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                        <ng-icon name="lucideFileText" class="text-emerald-600 dark:text-emerald-400 text-xl"></ng-icon>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ file.name }}</p>
                          <span class="text-[10px] text-zinc-500 dark:text-zinc-400">{{ file.size }}</span>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex-1 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 py-8">
                    No shared files
                  </div>
                }
              </div>
            }

            <!-- Groups (Connected to Common Rooms) -->
            @if (activeTab() === 'groups') {
              <div class="flex-1 flex flex-col justify-between">
                @if (isLoadingGroups() && groups().length === 0) {
                  <div class="flex-1 flex flex-col items-center justify-center gap-2 py-10 text-zinc-400">
                    <ng-icon name="lucideLoader2" class="text-2xl animate-spin text-emerald-500"></ng-icon>
                    <span class="text-xs">Loading common groups...</span>
                  </div>
                } @else if (groups().length > 0) {
                  <div class="space-y-2">
                    @for (group of groups(); track group.id || group.name) {
                      <div 
                        (click)="onGroupSelected(group, ctx)"
                        class="flex items-center gap-3 p-2.5 bg-zinc-100/60 dark:bg-zinc-800/40 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors">
                        <hlm-avatar class="size-9">
                          @if (group.avatar) {
                            <img hlmAvatarImage [src]="group.avatar" [alt]="group.name" />
                          }
                          <span hlmAvatarFallback class="bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 font-semibold">
                            {{ getInitials(group.name) }}
                          </span>
                        </hlm-avatar>
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ group.name }}</p>
                          <span class="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {{ group.membersCount ? (group.membersCount + ' members') : 'Group' }}
                          </span>
                        </div>
                      </div>
                    }

                    <!-- Cursor pagination "Load more" -->
                    @if (nextCursor()) {
                      <div class="pt-2 flex justify-center">
                        <button
                          type="button"
                          (click)="loadMoreGroups()"
                          [disabled]="isLoadingGroups()"
                          class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                          @if (isLoadingGroups()) {
                            <ng-icon name="lucideLoader2" class="text-sm animate-spin"></ng-icon>
                          }
                          <span>Load more</span>
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex-1 flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-400 py-8">
                    No common groups
                  </div>
                }
              </div>
            }
          </div>

        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `
})
export class UserProfileModalComponent implements OnChanges {
  private readonly groupService = inject(GroupService);

  @Input({ required: true }) user: UserProfileData = {
    id: '',
    name: 'User',
    phone: '',
    bio: '',
    isOnline: false,
    lastSeen: 'last seen recently',
    notificationsEnabled: true,
    avatarColor: 'bg-emerald-600 text-white'
  };

  @Input() photos: string[] = [];
  @Input() videos: VideoItem[] = [];
  @Input() files: FileItem[] = [];

  readonly groups = signal<GroupItem[]>([]);
  readonly isLoadingGroups = signal(false);
  readonly nextCursor = signal<string | null>(null);
  private hasLoadedGroupsOnce = false;

  @Output() groupClick = new EventEmitter<GroupItem>();
  @Output() groupClicked = new EventEmitter<GroupItem>();

  @Output() directChatClick = new EventEmitter<void>();
  @Output() chatClicked = new EventEmitter<void>();

  @Output() notificationsToggle = new EventEmitter<boolean>();
  @Output() notificationsToggled = new EventEmitter<boolean>();

  readonly activeTab = signal<TabType>('photos');
  readonly copiedPhone = signal(false);
  readonly copiedBio = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      const prevId = changes['user'].previousValue?.id;
      const curId = changes['user'].currentValue?.id;

      if (prevId !== curId) {
        this.groups.set([]);
        this.nextCursor.set(null);
        this.hasLoadedGroupsOnce = false;

        if (this.activeTab() === 'groups' && curId) {
          this.fetchCommonGroups();
        }
      }
    }
  }

  get isMuted(): boolean {
    return this.user?.notificationsEnabled === false;
  }

  get tabs(): { id: TabType; label: string; count: number }[] {
    return [
      { id: 'photos', label: 'Photos', count: this.photos.length },
      { id: 'videos', label: 'Videos', count: this.videos.length },
      { id: 'files', label: 'Files', count: this.files.length },
      { id: 'groups', label: 'Groups', count: this.groups().length }
    ];
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
    if (tab === 'groups' && !this.hasLoadedGroupsOnce) {
      this.fetchCommonGroups();
    }
  }

  fetchCommonGroups(cursor?: string): void {
    const targetUserId = this.user?.id;
    if (!targetUserId) {
      console.warn('Target userId is missing; cannot fetch common groups.');
      return;
    }

    this.isLoadingGroups.set(true);

    this.groupService.getCommonGroups(targetUserId, cursor, 20).subscribe({
      next: (res: CommonGroupsApiResponse | any) => {
        const rawItems: CommonGroupResponseItem[] = res?.data?.items || [];
        const next: string | null = res?.data?.nextCursor ?? null;

        const incomingItems: GroupItem[] = rawItems.map((item: any) => ({
          ...item,
          id: item.id || item._id,
          avatar: item.avatar || undefined,
          membersCount: item.membersCount ?? 0
        }));


        this.groups.update((current) => cursor ? [...current, ...incomingItems] : incomingItems);
        this.nextCursor.set(next);
        this.hasLoadedGroupsOnce = true;
        this.isLoadingGroups.set(false);
      },
      error: (err) => {
        console.error('Error fetching common rooms:', err);
        this.isLoadingGroups.set(false);
      }
    });
  }

  loadMoreGroups(): void {
    const cursor = this.nextCursor();
    if (cursor && !this.isLoadingGroups()) {
      this.fetchCommonGroups(cursor);
    }
  }

  onGroupSelected(group: GroupItem, ctx: any): void {
    this.groupClick.emit(group);
    this.groupClicked.emit(group);
    ctx.close();
  }

  toggleNotifications(): void {
    const nextMutedState = !this.isMuted;
    if (this.user) {
      this.user.notificationsEnabled = !nextMutedState;
    }
    this.notificationsToggle.emit(nextMutedState);
    this.notificationsToggled.emit(nextMutedState);
  }

  onStartChat(ctx: any): void {
    this.directChatClick.emit();
    this.chatClicked.emit();
    ctx.close();
  }

  copyPhone(phone?: string): void {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    this.copiedPhone.set(true);
    setTimeout(() => this.copiedPhone.set(false), 2000);
  }

  copyBio(bio?: string): void {
    if (!bio) return;
    navigator.clipboard.writeText(bio);
    this.copiedBio.set(true);
    setTimeout(() => this.copiedBio.set(false), 2000);
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 1);
  }
}
