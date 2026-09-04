import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';

import { AuthService } from '../../../services/auth/auth.service';

@Component({
	selector: 'app-phone-login',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		HlmCardImports,
		HlmLabelImports,
		HlmInputImports,
		HlmButtonImports,
		HlmButtonGroupImports,
	],
	templateUrl: './login.html',
})
export class PhoneLoginComponent {
	private readonly fb = inject(FormBuilder);
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	readonly isLoading = signal(false);
	readonly errorMessage = signal<string | null>(null);

	readonly form = this.fb.group({
		phone: [
			'',
			[
				Validators.required,
				Validators.pattern(/^9[0-9]{9}$/),
			],
		],
	});

	onSubmit(): void {
		if (this.form.invalid || this.isLoading()) {
			this.form.markAllAsTouched();
			return;
		}

		const phone = this.form.controls.phone.value!;
		this.isLoading.set(true);
		this.errorMessage.set(null);

		this.authService.sendVerificationCode(phone).subscribe({
			next: () => {
				this.isLoading.set(false);
				this.router.navigate(['/verify-otp'], {
					queryParams: { phone: `+98${phone}` },
				});
			},
			error: (err) => {
				this.isLoading.set(false);
				this.errorMessage.set(
					err.error?.message || 'could not send code, try again'
				);
			},
		});
	}
}
