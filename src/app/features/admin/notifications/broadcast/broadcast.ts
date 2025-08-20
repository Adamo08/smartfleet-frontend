import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NotificationService, NotificationType } from '../../../../core/services/notification';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './broadcast.html',
  styleUrl: './broadcast.css'
})
export class Broadcast {
  types = Object.values(NotificationType);
  form: FormGroup;

  constructor(private fb: FormBuilder, private notificationService: NotificationService, private toastr: ToastrService) {
    this.form = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(500)]],
      type: [NotificationType.GENERAL_UPDATE, Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const { message, type } = this.form.value;
    this.notificationService.broadcastNotificationAdmin({ message: message!, type: type as NotificationType }).subscribe({
      next: () => this.toastr.success('Broadcast sent'),
      error: () => this.toastr.error('Failed to send broadcast')
    });
  }
}
