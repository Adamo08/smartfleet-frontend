import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user && allowedRoles.includes(user.role)) {
        return true;
      }
    }

    router.navigate(['/']).then(r => console.log("Access denied, redirecting to home..."));
    return false;
  };
};
