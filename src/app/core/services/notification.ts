import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, Pageable } from '../models/pagination.interface';

// Updated to match backend NotificationDto
export interface Notification {
  id: number;
  userId: number;
  message: string;
  type: NotificationType;
  createdAt: Date;
  updatedAt?: Date; // Add this line
  read: boolean;
}

// Updated to match backend NotificationType enum
export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_CANCELLATION = 'BOOKING_CANCELLATION',
  REFUND_ISSUED = 'REFUND_ISSUED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  SLOT_AVAILABLE = 'SLOT_AVAILABLE',
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  GENERAL_UPDATE = 'GENERAL_UPDATE',
  PROMOTION_OFFER = 'PROMOTION_OFFER',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  USER_MESSAGE = 'USER_MESSAGE',
  FEEDBACK_REQUEST = 'FEEDBACK_REQUEST',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SECURITY_ALERT = 'SECURITY_ALERT',
  NEWSLETTER = 'NEWSLETTER',
  EVENT_REMINDER = 'EVENT_REMINDER',
  SURVEY_INVITATION = 'SURVEY_INVITATION',
  FEATURE_UPDATE = 'FEATURE_UPDATE',
  MAINTENANCE_NOTIFICATION = 'MAINTENANCE_NOTIFICATION',
  RESERVATION_PENDING = 'RESERVATION_PENDING',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  RESERVATION_CONFIRMED = 'RESERVATION_CONFIRMED',
  RESERVATION_COMPLETED = 'RESERVATION_COMPLETED'
}


export interface NotificationPreferences {
  id: number;
  userId: number;
  realTimeEnabled: boolean;
  emailEnabled: boolean;
}

// Backend UserNotificationPreferencesDto
export interface UserNotificationPreferences {
  realTimeEnabled: boolean;
  emailEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Notifications
  getNotifications(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/notifications?page=${page}&size=${size}`)
      .pipe(
        tap(response => {
          this.notificationsSubject.next(response.content || []);
          this.updateUnreadCount();
        })
      );
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${environment.apiUrl}/notifications/${id}/read`, {})
      .pipe(
        tap(() => {
          this.updateUnreadCount();
        })
      );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/notifications/mark-all-as-read`, {})
      .pipe(
        tap(() => {
          this.updateUnreadCount();
        })
      );
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/notifications/${id}`)
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
          this.notificationsSubject.next(notifications);
          this.updateUnreadCount();
        })
      );
  }

  // User Preferences (from UserNotificationPreferencesController)
  getUserNotificationPreferences(): Observable<UserNotificationPreferences> {
    return this.http.get<UserNotificationPreferences>(`${environment.apiUrl}/user/preferences/notifications`);
  }

  updateUserNotificationPreferences(preferences: UserNotificationPreferences): Observable<UserNotificationPreferences> {
    return this.http.put<UserNotificationPreferences>(`${environment.apiUrl}/user/preferences/notifications`, preferences);
  }

  // ADMIN: Broadcast a notification
  broadcastNotificationAdmin(payload: { message: string; type: NotificationType }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/notifications/broadcast`, payload);
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Load initial data
  loadInitialData(): void {
    this.getNotifications();
  }

  // Get notification type display name
  getNotificationTypeDisplayName(type: NotificationType): string {
    return type.toString().replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  // Get notification priority color
  getNotificationPriorityColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.RESERVATION_CONFIRMED:
        return 'success';
      case NotificationType.PAYMENT_FAILURE:
      case NotificationType.SECURITY_ALERT:
      case NotificationType.BOOKING_CANCELLATION:
        return 'error';
      case NotificationType.SLOT_UNAVAILABLE:
      case NotificationType.MAINTENANCE_NOTIFICATION:
        return 'warning';
      default:
        return 'info';
    }
  }

  getAllNotificationsAdmin(filter: NotificationFilter, pageable: Pageable): Observable<Page<Notification>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString())
      .set('sortBy', pageable.sortBy || 'id')
      .set('sortDirection', pageable.sortDirection || 'DESC');

    if (filter.userId) {
      params = params.set('userId', filter.userId.toString());
    }
    if (filter.read !== undefined) {
      params = params.set('read', filter.read.toString());
    }
    if (filter.type) {
      params = params.set('type', filter.type);
    }
    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }

    return this.http.get<Page<Notification>>(`${environment.apiUrl}/notifications/admin`, { params });
  }
}

export interface NotificationFilter {
  userId?: number;
  read?: boolean;
  type?: NotificationType;
  startDate?: Date;
  endDate?: Date;
}
