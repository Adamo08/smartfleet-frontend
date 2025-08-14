import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { map } from 'rxjs';

const redirectIfAuthenticated = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticatedAsync().pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        router.navigate(['/']).then(() => console.log("Redirecting authenticated user to home..."));
        return false;
      }
      return true;
    })
  );
};

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent),
    canActivate: [redirectIfAuthenticated]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent),
    canActivate: [redirectIfAuthenticated]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'oauth-callback',
    loadComponent: () => import('./oauth-callback/oauth-callback').then(m => m.OAuthCallbackComponent)
  }
];
