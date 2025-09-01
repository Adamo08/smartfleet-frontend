import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NotificationService, Notification, NotificationFilter, NotificationType } from '../../../../core/services/notification';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { NotificationDetail } from '../../../../features/notifications/notification-detail/notification-detail';
import { ActionIcons } from '../../../../shared/components/action-icons/action-icons';
import { SkeletonPage } from '../../../../shared/components/skeleton-page/skeleton-page';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Modal, ConfigrmDialog, Pagination, NotificationDetail, ActionIcons, SkeletonPage],
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css'
})
export class AdminNotifications implements OnInit {
  notificationsPage!: Page<Notification>;
  filterForm: FormGroup;
  isLoading = false;

  currentPage = 0;
  pageSize = 10;
  sortBy = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  selectedNotification: Notification | null = null;
  showNotificationDetailModal = false;
  showDeleteNotificationModal = false;
  notificationToDelete: Notification | null = null;

  readonly NotificationType = NotificationType;
  readonly DialogActionType = DialogActionType;

  constructor(
    private notificationService: NotificationService, 
    private fb: FormBuilder,
    private successModalService: SuccessModalService
  ) {
    this.filterForm = this.fb.group({
      userId: [null],
      read: [null],
      type: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filter: NotificationFilter = {
      userId: this.filterForm.value.userId || undefined,
      read: this.filterForm.value.read !== null ? this.filterForm.value.read : undefined,
      type: this.filterForm.value.type || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined
    };

    this.notificationService.getAllNotificationsAdmin(filter, pageable).subscribe({
      next: (page) => {
        this.notificationsPage = page;
        this.currentPage = page.number;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching notifications:', err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'DESC'; // Default to DESC for new sorts
    }
    this.loadNotifications();
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page on filter change
    this.loadNotifications();
  }

  clearFilters(): void {
    this.filterForm.reset({
      userId: null,
      read: null,
      type: '',
      startDate: null,
      endDate: null
    });
    this.currentPage = 0;
    this.loadNotifications();
  }

  viewNotification(notification: Notification): void {
    this.selectedNotification = notification;
    this.showNotificationDetailModal = true;
  }

  closeNotificationDetailModal(): void {
    this.showNotificationDetailModal = false;
    this.selectedNotification = null;
  }

  openDeleteNotificationModal(notification: Notification): void {
    this.notificationToDelete = notification;
    this.showDeleteNotificationModal = true;
  }

  confirmDeleteNotification(): void {
    if (!this.notificationToDelete?.id) return;
    
    this.notificationService.deleteNotification(this.notificationToDelete.id).subscribe({
      next: () => {
        this.successModalService.showEntityDeleted('Notification', `Notification has been successfully deleted`);
        this.closeDeleteNotificationModal();
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  closeDeleteNotificationModal(): void {
    this.showDeleteNotificationModal = false;
    this.notificationToDelete = null;
  }

  markNotificationAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        const index = this.notificationsPage.content.findIndex(n => n.id === updatedNotification.id);
        if (index !== -1) {
          this.notificationsPage.content[index] = updatedNotification;
        }
      },
      error: (err) => console.error('Error marking notification as read:', err)
    });
  }

  getTypeColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.RESERVATION_CONFIRMED:
        return 'bg-green-500/20 text-green-400';
      case NotificationType.BOOKING_CANCELLATION:
      case NotificationType.RESERVATION_CANCELLED:
        return 'bg-red-500/20 text-red-400';
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.REFUND_ISSUED:
        return 'bg-blue-500/20 text-blue-400';
      case NotificationType.PAYMENT_FAILURE:
      case NotificationType.SECURITY_ALERT:
        return 'bg-red-500/20 text-red-400';
      case NotificationType.SYSTEM_ALERT:
      case NotificationType.MAINTENANCE_NOTIFICATION:
        return 'bg-yellow-500/20 text-yellow-400';
      case NotificationType.GENERAL_UPDATE:
      case NotificationType.FEATURE_UPDATE:
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }
}
