import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VerifyOtpResponse {
	accessToken: string;
	refreshToken?: any;
}

@Injectable({
	providedIn: 'root',
})
export class OtpService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = 'http://localhost:3000/user';

	sendVerificationCode(phone: string): Observable<{ success: boolean; message: string }> {
		return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/send-otp`, {
			phone,
		});
	}

	verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
		console.log(phone,code)		
		return this.http.post<VerifyOtpResponse>(`${this.baseUrl}/verify-code`, {
			phoneNumber: phone,
			verificationCode: code,
		});
	}
}
