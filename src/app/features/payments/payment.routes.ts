import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full'
  },
  {
    path: 'history',
    loadComponent: () => import('./payment-history/payment-history').then(m => m.PaymentHistory)
  },
  {
    path: 'process',
    loadComponent: () => import('./payment-process/payment-process').then(m => m.PaymentProcess)
  },
  {
    path: 'success',
    loadComponent: () => import('./payment-success/payment-success').then(m => m.PaymentSuccess)
  },
  {
    path: 'cancel',
    loadComponent: () => import('./payment-cancel/payment-cancel').then(m => m.PaymentCancel)
  },
  {
    path: 'refund-request',
    loadComponent: () => import('./refund-request/refund-request').then(m => m.RefundRequest)
  },
  {
    path: 'refunds',
    loadComponent: () => import('./refund-list/refund-list').then(m => m.RefundList)
  },
  {
    path: 'refunds/:id',
    loadComponent: () => import('./refund-detail/refund-detail').then(m => m.RefundDetail)
  },
  {
    path: ':id',
    loadComponent: () => import('./payment-detail/payment-detail').then(m => m.PaymentDetail)
  }
];
