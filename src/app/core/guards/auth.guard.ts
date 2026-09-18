import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async (route, state) => {
    const router = inject(Router);

    const access_token = await cookieStore.get('access_token');

    if (access_token) {
        return true;
    } else {
        router.navigate(['/login']);
        return false;
    }
};
