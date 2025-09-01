import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification, NotificationType } from '../../../core/services/notification';
import { WebSocketService, WebSocketMessage } from '../../../core/services/websocket';
import { AuthService } from '../../../core/services/auth';
import { Subscription } from 'rxjs';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css'
})
export class NotificationBell implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadNotifications: Notification[] = [];
  unreadCount: number = 0;
  isDropdownOpen: boolean = false;
  wsConnected: boolean = false;
  private subscriptions: Subscription[] = [];
  private currentUser: User | null = null;

  constructor(
    private notificationService: NotificationService,
    private webSocketService: WebSocketService,
    private authService: AuthService
  ) {
    console.log('🔧 NotificationBell component initialized');
  }

  ngOnInit(): void {
    console.log('🔧 NotificationBell ngOnInit() called');

    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        console.log('📋 NotificationService notifications$ updated:', notifications);
        this.notifications = notifications;
        this.updateUnreadNotifications();
      }),
      this.notificationService.unreadCount$.subscribe(count => {
        console.log('🔢 NotificationService unreadCount$ updated:', count);
        this.unreadCount = count;
        this.updateUnreadNotifications();
      }),
      this.webSocketService.state$.subscribe(state => {
        console.log('🔌 WebSocket state$ updated:', state);
        this.wsConnected = state.connected;
      }),
      // Subscribe to WebSocket messages for real-time notifications
      this.webSocketService.messages$.subscribe(message => {
        console.log('📨 === NotificationBell: WebSocket Message Received ===');
        console.log('📨 Message:', message);
        console.log('📨 Message type:', message?.type);
        console.log('📨 Message payload:', message?.payload);

        if (message && message.payload) {
          console.log('✅ Message has payload, calling handleRealTimeNotification');
          this.handleRealTimeNotification(message.payload);
        } else {
          console.warn('⚠️ Message is null or missing payload');
          console.warn('⚠️ Message object:', message);
        }
      }),
      // ✅ NEW: Subscribe to currentUser$ to handle asynchronous user data
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        console.log('🔧 Current user updated from auth service:', this.currentUser);

        if (this.currentUser?.email) {
          console.log('✅ User authenticated with email:', this.currentUser.email);
          console.log('🔧 Initializing WebSocket connection...');
          this.initializeWebSocket(this.currentUser.email);
        } else {
          console.warn('⚠️ No authenticated user found, cannot initialize WebSocket');
        }
      })
    );

    // Load initial notifications
    console.log('🔧 Loading initial notification data...');
    this.notificationService.loadInitialData();
  }

  ngOnDestroy(): void {
    console.log('🔧 NotificationBell ngOnDestroy() called');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clear timeout if exists
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    
    this.webSocketService.disconnect();
  }

  private initializeWebSocket(userEmail: string): void {
    console.log('🔧 initializeWebSocket() called with userEmail:', userEmail);

    this.webSocketService.connect(userEmail).then(() => {
      console.log('✅ WebSocket connected for notifications');
    }).catch(error => {
      console.error('❌ Failed to connect WebSocket:', error);
    });
  }

  private handleRealTimeNotification(notification: any): void {
    console.log('🔧 handleRealTimeNotification() called with:', notification);

    try {
      // Convert the notification to match our interface
      const newNotification: Notification = {
        id: notification.id,
        userId: notification.userId,
        message: notification.message,
        type: notification.type as NotificationType,
        createdAt: new Date(notification.createdAt),
        read: notification.read
      };

      console.log('✅ Converted notification:', newNotification);

      // Add to the beginning of the list
      const currentNotifications = this.notifications;
      console.log('📋 Current notifications count:', currentNotifications.length);

      this.notifications = [newNotification, ...currentNotifications];
      console.log('📋 Updated notifications count:', this.notifications.length);

      // Update the notification service to keep everything in sync
      this.notificationService.addNotificationToCache(newNotification);

      // Update unread count if notification is unread
      if (!newNotification.read) {
        this.unreadCount++;
        console.log('🔢 Updated unread count to:', this.unreadCount);
      }

      console.log('✅ Real-time notification processed successfully:', newNotification);
    } catch (error) {
      console.error('❌ Error handling real-time notification:', error);
      console.error('❌ Notification data that caused error:', notification);
    }
  }

  private hideTimeout: any;

  showDropdown(): void {
    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.isDropdownOpen = true;
    
    // Refresh notifications when dropdown is opened
    console.log('🔧 Dropdown opened, refreshing notifications...');
    this.notificationService.loadInitialData();
  }

  hideDropdown(): void {
    // Add a small delay to allow moving from button to dropdown
    this.hideTimeout = setTimeout(() => {
      this.isDropdownOpen = false;
    }, 150); // 150ms delay
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        // Remove from unread notifications immediately for better UX
        this.unreadNotifications = this.unreadNotifications.filter(n => n.id !== notification.id);
        // Update the notification in the main list
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = { ...notification, read: true };
        }
      }
    });
  }

  private updateUnreadNotifications(): void {
    this.unreadNotifications = this.notifications.filter(n => !n.read);
    this.unreadCount = this.unreadNotifications.length;
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Mark all local notifications as read
        this.notifications = this.notifications.map(n => ({ ...n, read: true }));
        this.updateUnreadNotifications();
      }
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe();
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.RESERVATION_CONFIRMED:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case NotificationType.PAYMENT_FAILURE:
      case NotificationType.SECURITY_ALERT:
      case NotificationType.BOOKING_CANCELLATION:
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case NotificationType.SLOT_UNAVAILABLE:
      case NotificationType.MAINTENANCE_NOTIFICATION:
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getNotificationColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.RESERVATION_CONFIRMED:
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case NotificationType.PAYMENT_FAILURE:
      case NotificationType.SECURITY_ALERT:
      case NotificationType.BOOKING_CANCELLATION:
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case NotificationType.SLOT_UNAVAILABLE:
      case NotificationType.MAINTENANCE_NOTIFICATION:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  }

  getNotificationTypeDisplayName(type: NotificationType): string {
    return this.notificationService.getNotificationTypeDisplayName(type);
  }

  formatTime(date: Date): string {
    console.log('🔧 formatTime() called with date:', date);

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  getConnectionStatusIcon(): string {
    return this.wsConnected ?
      'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' :
      'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  getConnectionStatusColor(): string {
    return this.wsConnected ? 'text-green-500' : 'text-red-500';
  }
}
