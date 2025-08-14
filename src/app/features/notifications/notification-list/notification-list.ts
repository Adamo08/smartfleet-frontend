import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification';
import { Notification, UserNotificationPreferences, NotificationType } from '../../../core/services/notification';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationList implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  preferences: UserNotificationPreferences | null = null;
  loading = false;
  preferencesLoading = false;
  currentPage = 0;
  pageSize = 10;
  totalNotifications = 0;
  unreadCount = 0;

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
    const sub = this.notificationService.getNotifications(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.notifications = response.content;
        this.totalNotifications = response.totalElements;
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.toastr.error('Failed to load notifications');
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadPreferences(): void {
    this.preferencesLoading = true;
    const sub = this.notificationService.getUserNotificationPreferences().subscribe({
      next: (preferences) => {
        this.preferences = preferences;
        this.preferencesLoading = false;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
        this.preferencesLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  markAsRead(notificationId: number): void {
    const sub = this.notificationService.markAsRead(notificationId).subscribe({
      next: (updatedNotification) => {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          this.notifications[index] = updatedNotification;
          this.unreadCount = this.notifications.filter(n => !n.read).length;
        }
        this.toastr.success('Notification marked as read');
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
        this.toastr.error('Failed to mark notification as read');
      }
    });
    this.subscriptions.push(sub);
  }

  markAllAsRead(): void {
    const sub = this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.toastr.success(response.message || 'All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
        this.toastr.error('Failed to mark all notifications as read');
      }
    });
    this.subscriptions.push(sub);
  }

  deleteNotification(notificationId: number): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      const sub = this.notificationService.deleteNotification(notificationId).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== notificationId);
          this.totalNotifications--;
          if (!this.notifications.find(n => n.id === notificationId)?.read) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
          this.toastr.success('Notification deleted');
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
          this.toastr.error('Failed to delete notification');
        }
      });
      this.subscriptions.push(sub);
    }
  }

  updatePreferences(): void {
    if (!this.preferences) return;

    const sub = this.notificationService.updateUserNotificationPreferences(this.preferences).subscribe({
      next: (updatedPreferences) => {
        this.preferences = updatedPreferences;
        this.toastr.success('Notification preferences updated');
      },
      error: (error) => {
        console.error('Error updating preferences:', error);
        this.toastr.error('Failed to update preferences');
      }
    });
    this.subscriptions.push(sub);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  getPageNumbers(): number[] {
    const totalPages = Math.ceil(this.totalNotifications / this.pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
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
