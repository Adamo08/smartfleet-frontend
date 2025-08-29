import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const RESERVATION_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./reservation-list/reservation-list').then(m => m.ReservationList)
  },

  {
    path: ':id',
    canActivate: [authGuard],
    loadComponent: () => import('./reservation-detail/reservation-detail').then(m => m.ReservationDetail)
  },

  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () => import('./reservation-calendar/reservation-calendar').then(m => m.ReservationCalendar)
  },
  {
    path: 'slots',
    canActivate: [authGuard],
    loadComponent: () => import('./slot-selector/slot-selector').then(m => m.SlotSelector)
  }
];
