import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RefundCountService } from '../../../core/services/refund-count.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit, OnDestroy {
  currentUser: any = null;
  collapsed = false;
  isMobile = false; // Add this property
  pendingRefundCount = 0;
  @Output() collapsedChange = new EventEmitter<boolean>();
  
  // Submenu collapse states
  vehiclesExpanded = false;
  usersExpanded = false;
  paymentsExpanded = false;
  notificationsExpanded = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private refundCountService: RefundCountService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    // Auto-collapse on small screens
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnInit(): void {
    this.loadPendingRefundCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadPendingRefundCount(): void {
    // Only load for admin users
    if (this.currentUser?.role === 'ADMIN') {
      // Subscribe to the refund count service
      this.subscriptions.push(
        this.refundCountService.pendingCount$.subscribe(count => {
          this.pendingRefundCount = count;
        })
      );
      
      // Load initial count
      this.refundCountService.loadPendingRefundCount();
    }
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth < 768; // md breakpoint
    this.isMobile = isMobile; // Update isMobile property
    if (isMobile && !this.collapsed) {
      this.collapsed = true;
      this.collapsedChange.emit(this.collapsed);
    } else if (!isMobile && this.collapsed && !this.manualCollapse) {
      this.collapsed = false;
      this.collapsedChange.emit(this.collapsed);
    }
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.manualCollapse = this.collapsed; // Track manual collapse state
    this.collapsedChange.emit(this.collapsed);
  }

  toggleVehiclesSubmenu(): void {
    this.vehiclesExpanded = !this.vehiclesExpanded;
  }

  toggleUsersSubmenu(): void {
    this.usersExpanded = !this.usersExpanded;
  }

  togglePaymentsSubmenu(): void {
    this.paymentsExpanded = !this.paymentsExpanded;
  }

  toggleNotificationsSubmenu(): void {
    this.notificationsExpanded = !this.notificationsExpanded;
  }

  protected readonly window = window;
  private manualCollapse = false; // New property to track manual collapse
}
