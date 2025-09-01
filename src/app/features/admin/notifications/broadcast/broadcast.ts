import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationType } from '../../../../core/services/notification';
import { AdminNotificationService, EnhancedBroadcastRequest, BroadcastAnalytics, BroadcastHistory } from '../../../../core/services/admin-notification.service';
import { ToastrService } from 'ngx-toastr';

interface BroadcastTarget {
  type: 'all' | 'role' | 'specific' | 'group';
  value?: string;
  userIds?: number[];
  roles?: string[];
}

interface BroadcastSchedule {
  immediate: boolean;
  scheduledDate?: Date;
  timezone: string;
}

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './broadcast.html',
  styleUrl: './broadcast.css'
})
export class Broadcast implements OnInit {
  broadcastForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  showAdvancedOptions = false;
  showScheduleOptions = false;
  showTargetingOptions = false;
  showAnalytics = false;

  // Data
  recentBroadcasts: BroadcastHistory[] = [];
  analytics: BroadcastAnalytics | null = null;
  roles = ['USER', 'ADMIN', 'MODERATOR'];
  groups = ['Premium', 'Standard', 'Trial'];

  constructor(
    private fb: FormBuilder,
    private adminNotificationService: AdminNotificationService,
    private toastr: ToastrService
  ) {
    this.broadcastForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(500)]],
      type: [NotificationType.GENERAL_UPDATE, Validators.required],
      title: ['', [Validators.maxLength(100)]],
      target: this.fb.group({
        type: ['all', Validators.required],
        value: [''],
        userIds: [[]],
        roles: [[]]
      }),
      schedule: this.fb.group({
        immediate: [true],
        scheduledDate: [null],
        timezone: ['UTC']
      }),
      priority: ['normal', Validators.required],
      requiresConfirmation: [false],
      trackAnalytics: [true]
    });
  }

  ngOnInit(): void {
    this.loadRecentBroadcasts();
    this.loadBroadcastAnalytics();
    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    // Show/hide targeting options based on target type
    this.broadcastForm.get('target.type')?.valueChanges.subscribe((type: string) => {
      const targetGroup = this.broadcastForm.get('target');
      if (type === 'role') {
        targetGroup?.get('value')?.setValidators([Validators.required]);
        targetGroup?.get('userIds')?.clearValidators();
        targetGroup?.get('roles')?.clearValidators();
      } else if (type === 'specific') {
        targetGroup?.get('value')?.clearValidators();
        targetGroup?.get('userIds')?.setValidators([Validators.required]);
        targetGroup?.get('roles')?.clearValidators();
      } else if (type === 'group') {
        targetGroup?.get('value')?.setValidators([Validators.required]);
        targetGroup?.get('userIds')?.clearValidators();
        targetGroup?.get('roles')?.clearValidators();
      } else {
        targetGroup?.get('value')?.clearValidators();
        targetGroup?.get('userIds')?.clearValidators();
        targetGroup?.get('roles')?.clearValidators();
      }
      targetGroup?.updateValueAndValidity();
    });

    // Show/hide schedule options based on immediate flag
    this.broadcastForm.get('schedule.immediate')?.valueChanges.subscribe((immediate: boolean) => {
      if (!immediate) {
        this.broadcastForm.get('schedule.scheduledDate')?.setValidators([Validators.required]);
      } else {
        this.broadcastForm.get('schedule.scheduledDate')?.clearValidators();
      }
      this.broadcastForm.get('schedule.scheduledDate')?.updateValueAndValidity();
    });
  }

  submit(): void {
    if (this.broadcastForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.broadcastForm.value;

    const request: EnhancedBroadcastRequest = {
      message: formValue.message,
      type: formValue.type,
      title: formValue.title,
      target: formValue.target,
      schedule: formValue.schedule,
      priority: formValue.priority,
      requiresConfirmation: formValue.requiresConfirmation,
      trackAnalytics: formValue.trackAnalytics
    };

    this.adminNotificationService.enhancedBroadcast(request).subscribe({
      next: (response) => {
        this.toastr.success('Broadcast sent successfully');
        this.broadcastForm.reset({
          type: NotificationType.GENERAL_UPDATE,
          target: { type: 'all' },
          schedule: { immediate: true, timezone: 'UTC' },
          priority: 'normal',
          requiresConfirmation: false,
          trackAnalytics: true
        });
        this.loadRecentBroadcasts();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error sending broadcast:', error);
        this.toastr.error('Failed to send broadcast');
        this.isSubmitting = false;
      }
    });
  }

  loadRecentBroadcasts(): void {
    // TODO: Implement when backend endpoint is available
    this.recentBroadcasts = [];
  }

  loadBroadcastAnalytics(): void {
    this.adminNotificationService.getBroadcastAnalytics().subscribe({
      next: (analytics) => {
        this.analytics = analytics;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        // Fallback to default values
        this.analytics = {
          totalUsers: 0,
          sentCount: 0,
          failedCount: 0,
          readCount: 0,
          clickCount: 0,
          deliveryRate: 0,
          readRate: 0,
          clickRate: 0
        };
      }
    });
  }

  getTargetedUserCount(): number {
    const targetType = this.broadcastForm.get('target.type')?.value;
    
    if (targetType === 'all') {
      return this.analytics?.totalUsers || 0;
    } else if (targetType === 'role') {
      const role = this.broadcastForm.get('target.value')?.value;
      if (role) {
        // TODO: Implement when backend endpoint is available
        return 150; // Placeholder
      }
    } else if (targetType === 'group') {
      const group = this.broadcastForm.get('target.value')?.value;
      if (group) {
        // TODO: Implement when backend endpoint is available
        return 75; // Placeholder
      }
    } else if (targetType === 'specific') {
      const userIds = this.broadcastForm.get('target.userIds')?.value;
      return userIds?.length || 0;
    }
    
    return 0;
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  toggleScheduleOptions(): void {
    this.showScheduleOptions = !this.showScheduleOptions;
  }

  toggleTargetingOptions(): void {
    this.showTargetingOptions = !this.showTargetingOptions;
  }

  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
  }

  getNotificationTypeDisplayName(type: NotificationType): string {
    return this.adminNotificationService.getNotificationTypeDisplayName(type);
  }

  get types(): NotificationType[] {
    return this.adminNotificationService.types;
  }

  get priorities(): string[] {
    return ['low', 'normal', 'high', 'urgent'];
  }

  get timezones(): string[] {
    return ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'];
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}
