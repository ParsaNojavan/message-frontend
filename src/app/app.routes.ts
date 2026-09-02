import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./app').then(m => m.App)
    },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];
