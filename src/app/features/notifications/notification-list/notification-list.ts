import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification';
import { Notification, UserNotificationPreferences, NotificationType } from '../../../core/services/notification';
import { Subscription, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { Page, Pageable } from '../../../core/models/pagination.interface';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Pagination],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationList implements OnInit, OnDestroy {
  notificationsPage!: Page<Notification>;
  preferences: UserNotificationPreferences | null = null;
  loading = false;
  preferencesLoading = false;
  currentPage = 0;
  pageSize = 10;
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    this.loading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.notificationService.getNotifications(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        this.notificationsPage = response;
        this.currentPage = response.number;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });
  }

  loadPreferences(): void {
    this.preferencesLoading = true;
    const sub = this.notificationService.getUserNotificationPreferences().subscribe({
      next: (prefs: UserNotificationPreferences) => {
        this.preferences = prefs;
        this.preferencesLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading preferences:', error);
        this.preferencesLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  updatePreferences(): void {
    if (!this.preferences) return;
    
    const sub = this.notificationService.updateUserNotificationPreferences(this.preferences).subscribe({
      next: () => {
        this.toastr.success('Notification preferences updated successfully');
      },
      error: (error: any) => {
        console.error('Error updating preferences:', error);
        this.toastr.error('Failed to update notification preferences');
      }
    });
    this.subscriptions.push(sub);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  deleteNotification(id: number): void {
    const sub = this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.toastr.success('Notification deleted successfully');
        this.loadNotifications(); // Reload to update the list
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        this.toastr.error('Failed to delete notification');
      }
    });
    this.subscriptions.push(sub);
  }

  markAsRead(id: number): void {
    const sub = this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.toastr.success('Notification marked as read');
        this.loadNotifications(); // Reload to update the list
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        this.toastr.error('Failed to mark notification as read');
      }
    });
    this.subscriptions.push(sub);
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notificationsPage?.content?.filter(n => !n.read) || [];
    if (unreadNotifications.length === 0) {
      this.toastr.info('No unread notifications to mark');
      return;
    }

    // Use forkJoin for parallel execution
    const markObservables = unreadNotifications.map(notification => 
      this.notificationService.markAsRead(notification.id)
    );

    const sub = forkJoin(markObservables).subscribe({
      next: () => {
        this.toastr.success('All notifications marked as read');
        this.loadNotifications(); // Reload to update the list
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
        this.toastr.error('Failed to mark all notifications as read');
      }
    });
    this.subscriptions.push(sub);
  }

  get unreadCount(): number {
    return this.notificationsPage?.content?.filter(n => !n.read).length || 0;
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.RESERVATION_CONFIRMED:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case NotificationType.BOOKING_CANCELLATION:
      case NotificationType.RESERVATION_CANCELLED:
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case NotificationType.PAYMENT_SUCCESS:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case NotificationType.PAYMENT_FAILURE:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case NotificationType.SYSTEM_ALERT:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return 'M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z';
    }
  }

  getNotificationColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.RESERVATION_CONFIRMED:
      case NotificationType.PAYMENT_SUCCESS:
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case NotificationType.BOOKING_CANCELLATION:
      case NotificationType.RESERVATION_CANCELLED:
      case NotificationType.PAYMENT_FAILURE:
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case NotificationType.SYSTEM_ALERT:
      case NotificationType.SECURITY_ALERT:
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected readonly Math = Math;
}
