import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ForgotPasswordRequest } from '../../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    if (!this.email) {
      this.error = 'Please enter your email address';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.loading = true;
    this.error = '';

    const request: ForgotPasswordRequest = { email: this.email };

    this.authService.forgotPassword(request).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
        this.toastr.success('Password reset email sent!', 'Check your email');
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to send reset email. Please try again.';
      }
    });
  }
}
