import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CallService } from '../../services/call/call.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideMic,
  lucideMicOff,
  lucideVideo,
  lucideVideoOff,
  lucidePhoneOff,
  lucideScreenShare,
  lucideArrowRight,
  lucideVolume2,
  lucideVolumeX,
  lucideShieldCheck,
  lucideMessageSquare,
  lucideUser,
  lucideX,
  lucideMonitorUp,
  lucideArrowLeft,
} from '@ng-icons/lucide';
import { ConnectionState } from 'livekit-client';

@Component({
  selector: 'app-call-page',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideMic,
      lucideMicOff,
      lucideVideo,
      lucideVideoOff,
      lucidePhoneOff,
      lucideScreenShare,
      lucideArrowRight,
      lucideVolume2,
      lucideVolumeX,
      lucideShieldCheck,
      lucideMessageSquare,
      lucideUser,
      lucideX,
      lucideMonitorUp,
      lucideArrowLeft
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './call-page.component.html',
})
export class CallPageComponent implements OnInit, OnDestroy {
  callService = inject(CallService);
  private router = inject(Router);

  ConnectionState = ConnectionState;

  // کانتینرهای ویدیو
  @ViewChild('remoteVideoContainer') remoteVideoRef?: ElementRef<HTMLDivElement>;
  @ViewChild('remoteScreenContainer') remoteScreenRef?: ElementRef<HTMLDivElement>;
  @ViewChild('localVideoContainer') localVideoRef?: ElementRef<HTMLDivElement>;
  @ViewChild('localScreenContainer') localScreenRef?: ElementRef<HTMLDivElement>;

  // کنترل پنل کناری
  isSidePanelOpen = signal<boolean>(false);
  sidePanelTab = signal<'chat' | 'info'>('chat');
  isDesktop = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined') {
      this.isDesktop.set(window.innerWidth >= 1024);
    }
  }

  // تایمر تماس
  callDurationSeconds = signal<number>(0);
  private timerInterval: any = null;

  formattedDuration = computed(() => {
    const total = this.callDurationSeconds();
    const mins = Math.floor(total / 60).toString().padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  });

  // اولویت‌بندی استیج اصلی: آیا اسکرین‌شیری در حال پخش است؟
  hasActiveScreenShare = computed(() => {
    return !!this.callService.remoteScreenTrack?.() || this.callService.isScreenSharing();
  });

  constructor() {
    // ۱. اتچ کردن اسکرین‌شیر طرف مقابل (Remote Screen Share)
    effect(() => {
      const track = this.callService.remoteScreenTrack?.();
      const container = this.remoteScreenRef?.nativeElement;
      if (container) {
        container.innerHTML = '';
        if (track) {
          const el = track.attach();
          el.className = 'w-full h-full object-contain';
          container.appendChild(el);
        }
      }
    });

    // ۲. اتچ کردن پیش‌نمایش اسکرین‌شیر خود کاربر (Local Screen Share)
    effect(() => {
      const track = this.callService.localScreenTrack?.();
      const isSharing = this.callService.isScreenSharing();
      const container = this.localScreenRef?.nativeElement;
      if (container) {
        container.innerHTML = '';
        if (track && isSharing) {
          const el = track.attach();
          el.className = 'w-full h-full object-contain';
          container.appendChild(el);
        }
      }
    });

    // ۳. اتچ کردن دوربین ریموت مخاطب
    effect(() => {
      const track = this.callService.remoteVideoTrack();
      const container = this.remoteVideoRef?.nativeElement;
      if (container) {
        container.innerHTML = '';
        if (track) {
          const el = track.attach();
          el.className = 'w-full h-full object-cover sm:object-contain';
          container.appendChild(el);
        }
      }
    });

    // ۴. اتچ کردن دوربین محلی خود کاربر (PiP)
    effect(() => {
      const track = this.callService.localVideoTrack();
      const isCamOff = this.callService.isCamOff();
      const container = this.localVideoRef?.nativeElement;
      if (container) {
        container.innerHTML = '';
        if (track && !isCamOff) {
          const el = track.attach();
          el.className = 'w-full h-full object-cover -scale-x-100';
          container.appendChild(el);
        }
      }
    });

    // مدیریت تایمر
    effect(() => {
      const state = this.callService.connectionState();
      if (state === ConnectionState.Connected) {
        this.startTimer();
      } else if (state === ConnectionState.Disconnected) {
        this.stopTimer();
      }
    });
  }

  ngOnInit() {}

  toggleSidePanel(tab: 'chat' | 'info') {
    if (this.isSidePanelOpen() && this.sidePanelTab() === tab) {
      this.isSidePanelOpen.set(false);
    } else {
      this.sidePanelTab.set(tab);
      this.isSidePanelOpen.set(true);
    }
  }

  closeSidePanel() {
    this.isSidePanelOpen.set(false);
  }

  private startTimer() {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.callDurationSeconds.update((s) => s + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.callDurationSeconds.set(0);
  }

  async onEndCall() {
    await this.callService.endCall();
    this.router.navigate(['/chat']);
  }

  navigateBack() {
    this.router.navigate(['/chat']);
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}
