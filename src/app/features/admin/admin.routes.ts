import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard', // Redirect empty path to dashboard
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'vehicles',
    children: [
      { path: '', loadComponent: () => import('./vehicle-management/vehicle-list/vehicle-list').then(m => m.VehicleList) },
      { path: 'categories', loadComponent: () => import('./vehicle-management/vehicle-categories/vehicle-categories').then(m => m.VehicleCategories) },
      { path: 'brands', loadComponent: () => import('./vehicle-management/vehicle-brands/vehicle-brands').then(m => m.VehicleBrands) },
      { path: 'models', loadComponent: () => import('./vehicle-management/vehicle-models/vehicle-models').then(m => m.VehicleModels) },
      { path: 'create', loadComponent: () => import('./vehicle-management/vehicle-form/vehicle-form').then(m => m.VehicleForm) },
      { path: 'maintenance', loadComponent: () => import('./vehicle-management/maintenance/maintenance-list/maintenance-list').then(m => m.MaintenanceList) },
      { path: 'maintenance/create', loadComponent: () => import('./vehicle-management/maintenance/maintenance-form/maintenance-form').then(m => m.MaintenanceForm) },
      { path: 'maintenance/:id', loadComponent: () => import('./vehicle-management/maintenance/maintenance-detail/maintenance-detail').then(m => m.MaintenanceDetail) },
      { path: 'maintenance/:id/edit', loadComponent: () => import('./vehicle-management/maintenance/maintenance-form/maintenance-form').then(m => m.MaintenanceForm) },
      { path: 'fleet-status', loadComponent: () => import('./vehicle-management/fleet-status/fleet-status').then(m => m.FleetStatus) },
      { path: ':id', loadComponent: () => import('./vehicle-management/vehicle-detail/vehicle-detail').then(m => m.VehicleDetail) },
      { path: ':id/edit', loadComponent: () => import('./vehicle-management/vehicle-form/vehicle-form').then(m => m.VehicleForm) },
    ]
  },
  {
    path: 'users',
    children: [
      { path: '', loadComponent: () => import('./user-management/user-list/user-list').then(m => m.UserList) },
      { path: 'create', loadComponent: () => import('./user-management/user-form/user-form').then(m => m.UserForm) },
      { path: 'roles', loadComponent: () => import('./user-management/roles/role-list/role-list').then(m => m.RoleList) },
      { path: 'roles/create', loadComponent: () => import('./user-management/roles/role-form/role-form').then(m => m.RoleForm) },
      { path: 'roles/:id/edit', loadComponent: () => import('./user-management/roles/role-form/role-form').then(m => m.RoleForm) },
      { path: 'audit-log', loadComponent: () => import('./user-management/audit-log/audit-log').then(m => m.AuditLog) },
      { path: ':id', loadComponent: () => import('./user-management/user-detail/user-detail').then(m => m.UserDetail) },
      { path: ':id/edit', loadComponent: () => import('./user-management/user-form/user-form').then(m => m.UserForm) },
    ]
  },
  {
    path: 'reservations',
    children: [
      { path: '', loadComponent: () => import('./reservations/reservation-list/reservation-list').then(m => m.ReservationList) },
      { path: ':id', loadComponent: () => import('./reservations/reservation-detail/reservation-detail').then(m => m.ReservationDetail) }
    ]
  },
  {
    path: 'payments',
    children: [
      { path: '', redirectTo: 'transactions', pathMatch: 'full' },
      { path: 'transactions', loadComponent: () => import('./payments/transaction-list/transaction-list').then(m => m.TransactionList) },
      { path: 'transactions/:id', loadComponent: () => import('./payments/payment-detail/payment-detail').then(m => m.PaymentDetail) },
      { path: 'refund-requests', loadComponent: () => import('./payments/refund-requests/refund-requests').then(m => m.RefundRequests) },
      { path: 'refunds', loadComponent: () => import('./payments/refund-list/refund-list').then(m => m.RefundList) },
      { path: 'refunds/:id', loadComponent: () => import('./payments/refund-detail/refund-detail').then(m => m.RefundDetail) },
      { path: 'settings', loadComponent: () => import('./payments/payment-settings/payment-settings').then(m => m.PaymentSettings) },
    ]
  },

  {
    path: 'notifications',
    children: [
      { path: '', loadComponent: () => import('./notifications/admin-notifications/admin-notifications').then(m => m.AdminNotifications) },
      { path: 'broadcast', loadComponent: () => import('./notifications/broadcast/broadcast').then(m => m.Broadcast) },
      { path: 'templates', loadComponent: () => import('./notifications/templates/templates').then(m => m.Templates) },
    ]
  },
  {
    path: 'testimonials',
    children: [
      { path: '', redirectTo: 'moderation', pathMatch: 'full' },
      { path: 'moderation', loadComponent: () => import('./testimonials/moderation/moderation').then(m => m.Moderation) },
    ]
  },
  {
    path: 'analytics',
    children: [
      { path: '', loadComponent: () => import('./analytics/analytics').then(m => m.Analytics) }
    ]
  },

  {
    path: 'webhooks',
    children: [
      { path: '', redirectTo: 'logs', pathMatch: 'full' },
      { path: 'logs', loadComponent: () => import('./webhooks/logs/logs').then(m => m.Logs) },
      { path: 'endpoints', loadComponent: () => import('./webhooks/endpoints/endpoints').then(m => m.Endpoints) },
    ]
  },
];
