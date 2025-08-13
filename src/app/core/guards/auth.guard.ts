import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, catchError, of } from 'rxjs';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if already authenticated synchronously
  if (authService.isAuthenticated()) {
    return true;
  }

  // If not authenticated synchronously, check async (handles race condition)
  return authService.isAuthenticatedAsync().pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      router.navigate(['/auth/login']).then(r => console.log("Navigating to login..."));
      return false;
    }),
    catchError(() => {
      router.navigate(['/auth/login']).then(r => console.log("Navigating to login due to error..."));
      return of(false);
    })
  );
};
