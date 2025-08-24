import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import {Sidebar} from '../../components/sidebar/sidebar';
import {NotificationBell} from '../../../features/notifications/notification-bell/notification-bell';
import { AdminConfirmationDialogComponent } from '../../components/admin-confirmation-dialog/admin-confirmation-dialog';
import { SidebarMobileToggleComponent } from '../../components/sidebar-mobile-toggle/sidebar-mobile-toggle'; // Import new component
import { Router } from '@angular/router';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Sidebar, NotificationBell, AdminConfirmationDialogComponent, SidebarMobileToggleComponent], // Add to imports
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {
  currentUser: any = null;
  isSidebarCollapsed = false;
  @ViewChild(Sidebar) sidebarComponent!: Sidebar; // Get reference to Sidebar component

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser = this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  toggleSidebar(): void {
    this.sidebarComponent.toggleCollapse(); // Call toggleCollapse on the Sidebar component
  }

  switchToCustomerMode(): void {
    this.authService.switchToCustomerMode();
    this.router.navigate(['/']);
  }

  switchToAdminMode(): void {
    if (this.authService.isAdmin()) {
      this.authService.switchToAdminMode();
      this.router.navigate(['/admin']);
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isAdminMode(): boolean {
    return this.authService.isAdminMode();
  }
}
