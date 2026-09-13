import { Injectable, signal } from '@angular/core';
import {
  Room,
  RoomEvent,
  Track,
  VideoTrack,
  AudioTrack,
  ConnectionState,
} from 'livekit-client';

export interface CallPeer {
  id: string;
  name: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private room: Room | null = null;

  // وضعیت‌های کلی تماس
  isOpen = signal<boolean>(false);
  peer = signal<CallPeer | null>(null);
  isVideoCall = signal<boolean>(false);
  connectionState = signal<ConnectionState>(ConnectionState.Disconnected);

  // وضعیت کنترل‌ها
  isMicMuted = signal<boolean>(false);
  isCamOff = signal<boolean>(false);
  isScreenSharing = signal<boolean>(false);

  // سیگنال‌های مربوط به ترک‌های ویدیو و صدا
  localVideoTrack = signal<VideoTrack | null>(null);
  remoteVideoTrack = signal<VideoTrack | null>(null);
  
  localScreenTrack = signal<VideoTrack | null>(null);
  remoteScreenTrack = signal<VideoTrack | null>(null);
  
  remoteAudioTrack = signal<AudioTrack | null>(null);

  async startCall(peer: CallPeer, isVideo: boolean, serverUrl: string, token: string) {
    this.peer.set(peer);
    this.isVideoCall.set(isVideo);
    this.isOpen.set(true);
    this.connectionState.set(ConnectionState.Connecting);

    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    this.setupRoomListeners(this.room);

    try {
      await this.room.connect(serverUrl, token);
      this.connectionState.set(ConnectionState.Connected);

      // Publish Local Mic
      await this.room.localParticipant.setMicrophoneEnabled(true);
      this.isMicMuted.set(false);

      // Publish Local Video if video call
      if (isVideo) {
        await this.room.localParticipant.setCameraEnabled(true);
        this.isCamOff.set(false);
        const camPub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.videoTrack) {
          this.localVideoTrack.set(camPub.videoTrack as VideoTrack);
        }
      } else {
        this.isCamOff.set(true);
      }
    } catch (err) {
      console.error('Failed to connect to LiveKit room:', err);
      this.endCall();
    }
  }

  private setupRoomListeners(room: Room) {
    room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      this.connectionState.set(state);
    });

    // مدیریت دریافت ترک‌های جدید از مخاطب
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video) {
        // تفکیک دوربین از اسکرین‌شیر
        if (publication.source === Track.Source.ScreenShare) {
          this.remoteScreenTrack.set(track as VideoTrack);
        } else {
          this.remoteVideoTrack.set(track as VideoTrack);
        }
      } else if (track.kind === Track.Kind.Audio) {
        this.remoteAudioTrack.set(track as AudioTrack);
        // اتصال صدای مخاطب به DOM (ضروری برای شنیده شدن صدا)
        const el = track.attach();
        el.id = `audio-${participant.identity}`;
        document.body.appendChild(el);
      }
    });

    // مدیریت حذف ترک‌های مخاطب
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      // جدا کردن از DOM
      track.detach().forEach(el => el.remove());

      if (track.kind === Track.Kind.Video) {
        if (publication.source === Track.Source.ScreenShare) {
          this.remoteScreenTrack.set(null);
        } else {
          this.remoteVideoTrack.set(null);
        }
      } else if (track.kind === Track.Kind.Audio) {
        this.remoteAudioTrack.set(null);
      }
    });

    // مدیریت حالتی که کاربر محلی (خودمون) اسکرین شیر رو از طریق UI خود مرورگر قطع کنه
    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.source === Track.Source.ScreenShare) {
        this.isScreenSharing.set(false);
        this.localScreenTrack.set(null);
      }
      if (publication.source === Track.Source.Camera) {
        this.isCamOff.set(true);
        this.localVideoTrack.set(null);
      }
    });

    // خروج مخاطب
    room.on(RoomEvent.ParticipantDisconnected, () => {
      this.endCall();
    });

    // قطع شدن کامل روم
    room.on(RoomEvent.Disconnected, () => {
      this.cleanup();
    });
  }

  async toggleMic() {
    if (!this.room) return;
    const newState = !this.isMicMuted();
    await this.room.localParticipant.setMicrophoneEnabled(!newState);
    this.isMicMuted.set(newState);
  }

  async toggleCam() {
    if (!this.room) return;
    const newState = !this.isCamOff();
    await this.room.localParticipant.setCameraEnabled(!newState);
    this.isCamOff.set(newState);

    if (!newState) {
      const camPub = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
      this.localVideoTrack.set((camPub?.videoTrack as VideoTrack) || null);
    } else {
      this.localVideoTrack.set(null);
    }
  }

  async toggleScreenShare() {
    if (!this.room) return;
    const currentlySharing = this.isScreenSharing();
    
    try {
      // درخواست به مرورگر برای تغییر وضعیت اسکرین‌شیر
      await this.room.localParticipant.setScreenShareEnabled(!currentlySharing);
      this.isScreenSharing.set(!currentlySharing);

      // اگر شیر کردیم، ترکش رو ذخیره کنیم تا توی کامپوننت رندر بشه
      if (!currentlySharing) {
        const screenPub = this.room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        this.localScreenTrack.set((screenPub?.videoTrack as VideoTrack) || null);
      } else {
        this.localScreenTrack.set(null);
      }
    } catch (err) {
      // کاربر روی دکمه لغو (Cancel) پنجره مرورگر کلیک کرده است
      console.warn('Screen share cancelled/failed', err);
    }
  }

  async endCall() {
    if (this.room) {
      await this.room.disconnect();
    }
    this.cleanup();
  }

  private cleanup() {
    this.room = null;
    this.isOpen.set(false);
    this.peer.set(null);
    
    // پاک‌سازی تمام سیگنال‌ها
    this.localVideoTrack.set(null);
    this.remoteVideoTrack.set(null);
    this.localScreenTrack.set(null);
    this.remoteScreenTrack.set(null);
    this.remoteAudioTrack.set(null);
    
    this.isMicMuted.set(false);
    this.isCamOff.set(false);
    this.isScreenSharing.set(false);
    this.connectionState.set(ConnectionState.Disconnected);
  }
}
