import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { SocketService } from '../socket/socket.service';
import { RefreshResponse } from '../../models/dto/refreshResponse.dto';
import { SendOtpResponse } from '../../models/dto/otpResponse.dto';

export interface UserProfile {
  _id?: string;
  id?: string;
  phoneNumber?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerifyOtpResponse {
  statusCode: number;
  message?: string;
  data: {
    token: string;
    refreshToken: string;
    user?: UserProfile;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/user';

  currentUser = signal<string | null>(null);
  userProfile = signal<UserProfile | null>(null);

  constructor() {
    this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    try {
      const cookie = await cookieStore.get('access_token');
      const token = cookie?.value;

      if (token) {
        const userId = this.decodeToken(token);
        this.currentUser.set(userId);
        this.socketService.connect(token);

        this.getUserProfile().subscribe({
          error: (err) => console.error('Failed to load profile on session restore:', err)
        });
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  }

  async handleAuthentication(token: string, refreshToken: string): Promise<void> {
    await cookieStore.set('access_token', token);
    await cookieStore.set('refresh_token', refreshToken);

    const userId = this.decodeToken(token);
    this.currentUser.set(userId);

    this.socketService.connect(token);

    this.getUserProfile(true).subscribe({
      error: (err) => console.error('Failed to load profile after auth:', err)
    });
  }


  async loginWithToken(token: string, refreshToken: string): Promise<void> {
    return this.handleAuthentication(token, refreshToken);
  }


  sendVerificationCode(phone: string): Observable<SendOtpResponse> {
    const cleanPhone = phone.trim().replace(/^0/, '');
    const fullPhone = `+98${cleanPhone}`;
    return this.http.post<SendOtpResponse>(`${this.apiUrl}/login`, {
      phoneNumber: fullPhone
    });
  }

  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    const cleanPhone = phone.trim().replace(/^0/, '');
    const fullPhone = phone.startsWith('+') ? phone : `+98${cleanPhone}`;
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/verify-code`, {
      phoneNumber: fullPhone,
      code: code.trim()
    });
  }

  getUserProfile(forceRefresh = false): Observable<UserProfile> {
    if (!forceRefresh && this.userProfile()) {
      return of(this.userProfile()!);
    }

    return this.http.get<{ data: UserProfile } | UserProfile>(`${this.apiUrl}/user-profile`, {
      withCredentials: true
    }).pipe(
      map((response: any) => response.data || response),
      tap((profile: UserProfile) => {
        this.userProfile.set(profile);
      })
    );
  }

  updateProfile(updateData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.patch<{ data: UserProfile } | UserProfile>(`${this.apiUrl}/user-update`, updateData, {
      withCredentials: true
    }).pipe(
      map((response: any) => response.data || response),
      tap((updated: UserProfile) => {
        const current = this.userProfile() || {};
        this.userProfile.set({ ...current, ...updated });
      })
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    return from(cookieStore.get('refresh_token')).pipe(
      switchMap((cookie) => {
        const refreshTokenValue = cookie?.value;
        if (!refreshTokenValue) {
          this.logout();
          return throwError(() => new Error('Refresh token not found'));
        }

        return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh-token`, {
          refreshToken: refreshTokenValue,
        }).pipe(
          switchMap((newToken) => {
            const saveCookiesPromise = cookieStore.set('access_token', newToken.data.token);
            return from(saveCookiesPromise).pipe(
              map(() => newToken)
            );
          })
        );
      })
    );
  }

  private decodeToken(token: string): string | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;

      const decodedJson = JSON.parse(
        decodeURIComponent(
          atob(payloadBase64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      );

      return decodedJson.sub || decodedJson.userId || decodedJson.id || null;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    this.socketService.disconnect();
    this.currentUser.set(null);
    this.userProfile.set(null);

    try {
      await cookieStore.delete('access_token');
      await cookieStore.delete('refresh_token');
    } catch (e) {
      console.warn('Cookie delete failed:', e);
    }

    this.router.navigate(['/login']);
  }
}
