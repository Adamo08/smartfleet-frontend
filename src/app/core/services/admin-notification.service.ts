import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationType } from './notification';

// Admin-specific interfaces - separate from main notification service
export interface EmailTemplateMetadata {
  id: number;
  name: string;
  type: NotificationType;
  subject: string;
  templateFile: string; // References existing Thymeleaf template
  description: string;
  variables: string[];
  category: string;
  icon: string;
  color: string;
  isActive: boolean;
  lastModified: Date;
  usageCount: number;
  createdAt: Date;
}

export interface EnhancedBroadcastRequest {
  message: string;
  type: NotificationType;
  title?: string;
  target: {
    type: 'all' | 'role' | 'specific' | 'group';
    value?: string;
    userIds?: number[];
    roles?: string[];
  };
  schedule: {
    immediate: boolean;
    scheduledDate?: Date;
    timezone: string;
  };
  priority: string;
  requiresConfirmation: boolean;
  trackAnalytics: boolean;
}

export interface BroadcastAnalytics {
  totalUsers: number;
  sentCount: number;
  failedCount: number;
  readCount: number;
  clickCount: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
}

export interface BroadcastHistory {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  target: {
    type: string;
    value?: string;
  };
  scheduledAt: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sent' | 'failed';
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Enhanced broadcast with targeting and scheduling
  enhancedBroadcast(request: EnhancedBroadcastRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/api/admin/notifications/broadcast-enhanced`, request, { responseType: 'text' });
  }

  // Get broadcast analytics
  getBroadcastAnalytics(): Observable<BroadcastAnalytics> {
    return this.http.get<BroadcastAnalytics>(`${this.apiUrl}/api/admin/notifications/broadcast-analytics`);
  }

  // Get user count by role
  getUsersCountByRole(role: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/api/admin/notifications/users/count-by-role/${role}`);
  }

  // Get user count by group
  getUsersCountByGroup(groupName: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/api/admin/notifications/users/count-by-group/${groupName}`);
  }

  // Email template metadata management (NOT HTML content)
  getEmailTemplates(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/api/admin/notifications/email-templates`, { params });
  }

  getEmailTemplatesWithFilters(
    name?: string,
    category?: string,
    type?: NotificationType,
    isActive?: boolean,
    page: number = 0,
    size: number = 20
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (name) params = params.set('name', name);
    if (category) params = params.set('category', category);
    if (type) params = params.set('type', type);
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.get<any>(`${this.apiUrl}/api/admin/notifications/email-templates/filtered`, { params });
  }

  getEmailTemplateById(id: number): Observable<EmailTemplateMetadata> {
    return this.http.get<EmailTemplateMetadata>(`${this.apiUrl}/api/admin/notifications/email-templates/${id}`);
  }

  createEmailTemplate(template: Omit<EmailTemplateMetadata, 'id' | 'lastModified' | 'usageCount' | 'createdAt'>): Observable<EmailTemplateMetadata> {
    return this.http.post<EmailTemplateMetadata>(`${this.apiUrl}/api/admin/notifications/email-templates`, template);
  }

  updateEmailTemplate(id: number, template: Partial<EmailTemplateMetadata>): Observable<EmailTemplateMetadata> {
    return this.http.put<EmailTemplateMetadata>(`${this.apiUrl}/api/admin/notifications/email-templates/${id}`, template);
  }

  deleteEmailTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/admin/notifications/email-templates/${id}`);
  }

  toggleTemplateStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/api/admin/notifications/email-templates/${id}/toggle-status`, {});
  }

  duplicateTemplate(id: number): Observable<EmailTemplateMetadata> {
    return this.http.post<EmailTemplateMetadata>(`${this.apiUrl}/api/admin/notifications/email-templates/${id}/duplicate`, {});
  }

  // Utility methods
  getNotificationTypeDisplayName(type: NotificationType): string {
    const displayNames: Record<NotificationType, string> = {
      [NotificationType.PAYMENT_SUCCESS]: 'Payment Success',
      [NotificationType.PAYMENT_FAILURE]: 'Payment Failure',
      [NotificationType.REFUND_ISSUED]: 'Refund Issued',
      [NotificationType.RESERVATION_PENDING]: 'Reservation Pending',
      [NotificationType.RESERVATION_CONFIRMED]: 'Reservation Confirmed',
      [NotificationType.RESERVATION_CANCELLED]: 'Reservation Cancelled',
      [NotificationType.ACCOUNT_VERIFICATION]: 'Account Verification',
      [NotificationType.PASSWORD_RESET]: 'Password Reset',
      [NotificationType.GENERAL_UPDATE]: 'General Update',
      [NotificationType.SYSTEM_ALERT]: 'System Alert',
      [NotificationType.PROMOTION_OFFER]: 'Promotion Offer',
      [NotificationType.BOOKING_CONFIRMATION]: 'Booking Confirmation',
      [NotificationType.BOOKING_CANCELLATION]: 'Booking Cancellation',
      [NotificationType.SLOT_AVAILABLE]: 'Slot Available',
      [NotificationType.SLOT_UNAVAILABLE]: 'Slot Unavailable',
      [NotificationType.USER_MESSAGE]: 'User Message',
      [NotificationType.FEEDBACK_REQUEST]: 'Feedback Request',
      [NotificationType.RESERVATION_COMPLETED]: 'Reservation Completed',
      [NotificationType.FAVORITE_ADDED]: 'Favorite Added',
      [NotificationType.FAVORITE_REMOVED]: 'Favorite Removed',
      [NotificationType.REFUND_REQUEST]: 'Refund Request',
      [NotificationType.SECURITY_ALERT]: 'Security Alert',
      [NotificationType.NEWSLETTER]: 'Newsletter',
      [NotificationType.EVENT_REMINDER]: 'Event Reminder',
      [NotificationType.SURVEY_INVITATION]: 'Survey Invitation',
      [NotificationType.MAINTENANCE_NOTIFICATION]: 'Maintenance Notification',
      [NotificationType.FEATURE_UPDATE]: 'Feature Update'
    };
    return displayNames[type] || type;
  }

  get types(): NotificationType[] {
    return Object.values(NotificationType);
  }
}
