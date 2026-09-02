// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SendOtpResponse {
  message: string;
  success: boolean;
  expiresIn?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/user';

  sendVerificationCode(phone: string): Observable<SendOtpResponse> {

    const fullPhone = `+98${phone.trim()}`;
    return this.http.post<SendOtpResponse>(`${this.apiUrl}/login`, {
      phoneNumber: fullPhone
    });
  }
}
