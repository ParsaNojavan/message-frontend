import { afterNextRender, Component, computed, inject, OnInit, signal, type OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, firstValueFrom } from 'rxjs';

import { form, FormField, FormRoot, maxLength, minLength, required, submit } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';

import { BrnInputOtpImports } from '@spartan-ng/brain/input-otp';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';

import { OtpService } from '../../../services/auth/otp.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    FormRoot,
    FormField,
    NgIcon,
    HlmButtonImports,
    HlmToasterImports,
    HlmCardImports,
    HlmFieldImports,
    BrnInputOtpImports,
    HlmInputOtpImports,
  ],
  providers: [provideIcons({ lucideRefreshCw })],
  templateUrl: './verify-otp.html',
  host: {
    class: 'flex min-h-screen w-full items-center justify-center p-4',
  },
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly otpService = inject(OtpService);

  private _intervalId?: ReturnType<typeof setInterval>;

  readonly phone = signal<string>('');

  readonly maxLength = 4;
  readonly countdown = signal(60);
  readonly isResendDisabled = computed(() => this.countdown() > 0);
  readonly isVerifying = signal(false);
  readonly isResending = signal(false);

  readonly transformPaste = (pastedText: string) => pastedText.replaceAll('-', '').trim();

  private readonly _model = signal({ otp: '' });

  readonly form = form(
    this._model,
    (schemaPath) => {
      required(schemaPath.otp, { message: 'Verification code is required' });
      minLength(schemaPath.otp, this.maxLength, { message: `Code must be ${this.maxLength} digits` });
      maxLength(schemaPath.otp, this.maxLength, { message: `Code must be ${this.maxLength} digits` });
    },
    {
      submission: {
        action: async () => {
          await this.verifyCode();
        },
      },
    }
  );

  constructor() {
    afterNextRender(() => {
      if (this.phone()) {
        this.startCountdown();
      }
    });
  }

  ngOnInit() {
    const phoneFromQuery = this.route.snapshot.queryParamMap.get('phone');
    const phoneFromState = history.state?.phone;
    const resolvedPhone = phoneFromQuery || phoneFromState;

    if (!resolvedPhone) {
      console.warn('Phone number not found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.phone.set(resolvedPhone);
  }

  submit() {
    submit(this.form);
  }

  async verifyCode() {
    if (this.isVerifying()) return;

    this.isVerifying.set(true);
    const code = this._model().otp;

    try {
      const res = await firstValueFrom(this.otpService.verifyOtp(this.phone(), code));

      if (res?.accessToken) {
        localStorage.setItem('access_token', res.accessToken);
      }

      toast.success('Logged in successfully');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      toast.error('Authentication error', {
        description: err?.error?.message || 'The entered code is invalid or expired.',
      });
    } finally {
      this.isVerifying.set(false);
    }
  }

  async resendOtp() {
    if (this.isResendDisabled() || this.isResending()) return;

    this.isResending.set(true);
    try {
      await firstValueFrom(this.otpService.sendVerificationCode(this.phone()));
      toast.success('New code sent');
      this.resetCountdown();
    } catch (err: any) {
      toast.error('Resend error', {
        description: err?.error?.message || 'Failed to send code.',
      });
    } finally {
      this.isResending.set(false);
    }
  }

  changePhone() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.stopCountdown();
  }

  private resetCountdown() {
    this.countdown.set(60);
    this.startCountdown();
  }

  private startCountdown() {
    this.stopCountdown();
    this._intervalId = setInterval(() => {
      this.countdown.update((count) => Math.max(0, count - 1));
      if (this.countdown() === 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }
}
