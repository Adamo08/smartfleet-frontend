import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangePasswordRequest } from '../../../core/models/user.interface';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.css'
})
export class ChangePasswordModal {
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<ChangePasswordRequest>();

  formData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  isSubmitting = false;
  errors = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  };

  onSubmit(): void {
    this.clearErrors();

    // Validate form
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    const request: ChangePasswordRequest = {
      oldPassword: this.formData.oldPassword,
      newPassword: this.formData.newPassword
    };

    this.passwordChanged.emit(request);
  }

  private validateForm(): boolean {
    let isValid = true;

    if (!this.formData.oldPassword) {
      this.errors.oldPassword = 'Current password is required';
      isValid = false;
    }

    if (!this.formData.newPassword) {
      this.errors.newPassword = 'New password is required';
      isValid = false;
    } else if (this.formData.newPassword.length < 6) {
      this.errors.newPassword = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (!this.formData.confirmPassword) {
      this.errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (this.formData.newPassword !== this.formData.confirmPassword) {
      this.errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  private clearErrors(): void {
    this.errors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: ''
    };
  }

  onClose(): void {
    this.clearForm();
    this.closed.emit();
  }

  private clearForm(): void {
    this.formData = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.clearErrors();
    this.isSubmitting = false;
  }

  onSubmissionComplete(): void {
    this.isSubmitting = false;
    this.clearForm();
  }

  setError(error: string): void {
    this.errors.general = error;
    this.isSubmitting = false;
  }
}
