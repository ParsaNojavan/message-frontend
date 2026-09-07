import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../components/auth/login/login').then((m) => m.PhoneLoginComponent),
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('../components/auth/verify-otp/verify-otp').then((m) => m.VerifyOtpComponent),
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('../components/chat/chat-page.component').then(m => m.ChatPageComponent)
  },
];
