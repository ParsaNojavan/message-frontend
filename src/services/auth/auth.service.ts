import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { SocketService } from '../socket/socket.service';
import { RefreshResponse } from '../../models/dto/refreshResponse.dto';
import { SendOtpResponse } from '../../models/dto/otpResponse.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/user';

  currentUser = signal<string | null>(null);

  constructor() {
    this.restoreSession();
  }

  private async restoreSession() {
    try {
      const cookie = await cookieStore.get('access_token');
      const token = cookie?.value;

      if (token) {
        const userId = this.decodeToken(token);
        this.currentUser.set(userId);
        this.socketService.connect(token);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  }

  async handleAuthentication(token: string, refreshToken: string) {
    await cookieStore.set('access_token', token);
    await cookieStore.set('refresh_token', refreshToken);

    const userId = this.decodeToken(token);
    this.currentUser.set(userId);

    this.socketService.connect(token);
  }

  sendVerificationCode(phone: string): Observable<SendOtpResponse> {

    const fullPhone = `+98${phone.trim()}`;
    return this.http.post<SendOtpResponse>(`${this.apiUrl}/login`, {
      phoneNumber: fullPhone
    });
  }

  refreshToken(): Observable<RefreshResponse> {
    return from(cookieStore.get('refresh_token')).pipe(
      switchMap((cookie) => {
        const refreshToken = cookie?.value;
        if (!refreshToken) {
          this.logout();
          return throwError(() => new Error('Refresh token not found'));
        }

        return this.http.post<RefreshResponse>(`${this.apiUrl}/user/refresh-token`, {
          refreshToken: refreshToken,
        }).pipe(

          switchMap((newToken) => {
            const saveCookiesPromise = Promise.all([
              cookieStore.set('access_token', newToken.data.token),
            ]);

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
      const decodedJson = JSON.parse(
        decodeURIComponent(
          atob(payloadBase64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      );

      return decodedJson.sub;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    this.socketService.disconnect();
    this.currentUser.set(null);

    await cookieStore.delete('access_token');
    await cookieStore.delete('refresh_token');

    this.router.navigate(['/login']);
  }
}
