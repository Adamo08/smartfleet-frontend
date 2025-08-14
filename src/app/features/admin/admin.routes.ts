import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/reservation-stats/reservation-stats').then(m => m.ReservationStats)
  },
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-list/user-list').then(m => m.UserList)
  },
  {
    path: 'settings',
    loadComponent: () => import('./system-settings/system-settings').then(m => m.SystemSettings)
  }
];
