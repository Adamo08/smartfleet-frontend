import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, switchMap } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Don't intercept auth endpoints to avoid infinite loops
        if (!req.url.includes('/auth/')) {
          console.log('401 error detected, attempting token refresh...');
          
          // Try to refresh the token
          authService.refreshToken().subscribe({
            next: () => {
              console.log('Token refreshed successfully, retrying request...');
              // The request will be retried automatically by the client
            },
            error: (refreshError) => {
              console.log('Token refresh failed, logging out...');
              authService.logout();
              router.navigate(['/auth/login']).then(r => console.log("Navigating to login due to refresh failure..."));
            }
          });
        } else {
          // For auth endpoints, just logout
          authService.logout();
          router.navigate(['/auth/login']).then(r => console.log("Navigating to login due to auth endpoint 401..."));
        }
      }
      return throwError(() => error);
    })
  );
};
