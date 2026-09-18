import { Injectable, inject } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../../services/auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private authService = inject(AuthService);

    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

        if (request.url.includes('/login') ||
            request.url.includes('/refresh-token') ||
            request.url.includes('/verify-code')
        ) {
            return next.handle(request);
        }

        return from(cookieStore.get('access_token')).pipe(
            switchMap((tokenObj) => {
                let authReq = request;

                if (tokenObj && tokenObj.value) {
                    authReq = this.addTokenHeader(request, tokenObj.value);
                }

                return next.handle(authReq).pipe(
                    catchError((error) => {
                        if (error instanceof HttpErrorResponse && error.status === 401) {
                            return this.handle401Error(authReq, next);
                        }
                        return throwError(() => error);
                    })
                );
            })
        );
    }

    private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap((response) => {
                    this.isRefreshing = false;
                    const newToken = response.data.token;

                    this.refreshTokenSubject.next(newToken);

                    return next.handle(this.addTokenHeader(request, newToken));
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    this.authService.logout();
                    return throwError(() => err);
                })
            );
        } else {
            return this.refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap((token) => {

                    return next.handle(this.addTokenHeader(request, token as string));
                })
            );
        }
    }
}
