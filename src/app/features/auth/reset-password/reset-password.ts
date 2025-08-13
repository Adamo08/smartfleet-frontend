import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ResetPasswordRequest } from '../../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent implements OnInit {
  resetData: ResetPasswordRequest = {
    token: '',
    newPassword: ''
  };
  
  confirmPassword = '';
  loading = false;
  error = '';
  success = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.resetData.token = token;
    } else {
      this.error = 'No reset token provided';
    }
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.resetPassword(this.resetData).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.toastr.success('Password reset successfully!', 'Success');
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Password reset failed. Please try again.';
      }
    });
  }

  private validateForm(): boolean {
    if (!this.resetData.token) {
      this.error = 'No reset token provided';
      return false;
    }

    if (!this.resetData.newPassword) {
      this.error = 'Please enter a new password';
      return false;
    }

    if (this.resetData.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return false;
    }

    if (this.resetData.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return false;
    }

    return true;
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
