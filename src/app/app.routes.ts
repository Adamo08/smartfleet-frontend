import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';

import { AUTH_ROUTES } from './features/auth/auth.routes';
import { ADMIN_ROUTES } from './features/admin/admin.routes';
import { RESERVATION_ROUTES } from './features/reservations/reservation.routes';
import {HomeComponent} from './features/home/home';
import {VehicleList} from './features/vehicles/vehicle-list/vehicle-list';
import {VehicleDetail} from './features/vehicles/vehicle-detail/vehicle-detail';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/layouts/main-layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then(m => m.HomeComponent) },
      { path: 'vehicles', loadComponent: () => import('./features/vehicles/vehicle-list/vehicle-list').then(m => m.VehicleList) },
      { path: 'vehicles/:id', loadComponent: () => import('./features/vehicles/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail) },
      { path: 'reservations', canActivate: [authGuard], children: RESERVATION_ROUTES },
      { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/user-profile/user-profile').then(m => m.UserProfileComponent) },
      { path: 'payments', canActivate: [authGuard], loadComponent: () => import('./features/payments/payment-history/payment-history').then(m => m.PaymentHistory) },
      { path: 'my-bookmarks', canActivate: [authGuard], loadComponent: () => import('./features/bookmarks/bookmarks-list/bookmarks-list').then(m => m.BookmarksList) },
      { path: 'favorites', canActivate: [authGuard], loadComponent: () => import('./features/favorites/favorites-list/favorites-list').then(m => m.FavoritesList) },
      { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/notifications/notification-list/notification-list').then(m => m.NotificationList) },
    ]
  },
  {
    path: 'auth',
    loadComponent: () => import('./shared/layouts/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: AUTH_ROUTES
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./shared/layouts/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: ADMIN_ROUTES
  },
  // Error pages
  { path: 'unauthorized', loadComponent: () => import('./features/pages/unauthorized/unauthorized').then(m => m.Unauthorized) },
  { path: 'forbidden', loadComponent: () => import('./features/pages/forbidden/forbidden').then(m => m.Forbidden) },
  { path: 'not-found', loadComponent: () => import('./features/pages/not-found/not-found').then(m => m.NotFound) },
  // Catch all route - redirect to not-found
  { path: '**', redirectTo: '/not-found' }
];
