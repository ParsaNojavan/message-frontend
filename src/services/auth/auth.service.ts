// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export interface SendOtpResponse {
  message: string;
  success: boolean;
  expiresIn?: number;
}

export interface RefreshResponse {
  data: {
    token: string;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/user';

  sendVerificationCode(phone: string): Observable<SendOtpResponse> {

    const fullPhone = `+98${phone.trim()}`;
    return this.http.post<SendOtpResponse>(`${this.apiUrl}/login`, {
      phoneNumber: fullPhone
    });
  }

  refreshToken(): Observable<RefreshResponse> {
    return from(cookieStore.get('refresh_token')).pipe(
      switchMap((refreshToken) => {
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

  async logout(): Promise<void> {
    await cookieStore.delete('access_token');
    await cookieStore.delete('refresh_token');

    this.router.navigate(['/login']);
  }
}
