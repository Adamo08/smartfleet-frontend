import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationType } from '../../../core/services/notification';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-detail.html',
  styleUrl: './notification-detail.css'
})
export class NotificationDetail {
  @Input() notification!: Notification;
  readonly NotificationType = NotificationType;
}
