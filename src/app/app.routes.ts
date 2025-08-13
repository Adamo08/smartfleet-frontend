import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.interface';
import {HomeComponent} from './features/home/home';
import {VehicleList} from './features/vehicles/vehicle-list/vehicle-list';
import {VehicleDetail} from './features/vehicles/vehicle-detail/vehicle-detail';
import {ReservationList} from './features/reservations/reservation-list/reservation-list';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'auth/oauth-callback',
    loadComponent: () => import('./features/auth/oauth-callback/oauth-callback').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'vehicles',
    loadComponent: () => import('./features/vehicles/vehicle-list/vehicle-list').then(m => m.VehicleList)
  },
  {
    path: 'vehicles/:id',
    loadComponent: () => import('./features/vehicles/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail),
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reservations/reservation-list/reservation-list').then(m => m.ReservationList)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/user-profile/user-profile').then(m => m.UserProfile)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
