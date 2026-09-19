import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ChatPageComponent } from '../components/chat/chat-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chat',
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
      import('../components/chat/chat-page.component').then(m => m.ChatPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chat/:id',
    component: ChatPageComponent
  },
  {
    path: 'call/:peerId',
    loadComponent: () =>
      import('../components/call/call-page.component').then((m) => m.CallPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'support',
    loadComponent: () =>
      import('../components/support/support-service.component').then((m) => m.SupportServiceComponent),
    canActivate: [authGuard]
  },
];
