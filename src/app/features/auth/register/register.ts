import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RegisterRequest, OAuthProvider, User } from '../../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  registerData: RegisterRequest = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };

  confirmPassword = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}



  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.registerData).subscribe({
      next: (user: User) => {
        this.loading = false;
        this.toastr.success(`Welcome, ${user.firstName}! Please log in to continue.`, 'Account Created!');
        this.router.navigate(['/auth/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;

        if (err.error && typeof err.error === 'object' && !Array.isArray(err.error)) {
          const errorKeys = Object.keys(err.error);

          if (errorKeys.length > 0) {
            const fieldName = errorKeys[0];
            const message = err.error[fieldName];
            this.error = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${message}`;
          } else {
            this.error = 'An unknown validation error occurred.';
          }
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Registration failed due to a server error.';
        }

        this.toastr.error(this.error, 'Registration Failed');
      }
    });
  }


  private validateForm(): boolean {
    // Reset error on new validation attempt
    this.error = '';

    if (!this.registerData.email || !this.registerData.password ||
      !this.registerData.firstName || !this.registerData.lastName) {
      this.error = 'Please fill in all required fields';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.error = 'Please enter a valid email address';
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return false;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return false;
    }

    return true;
  }

  registerWithGoogle(): void {
    this.authService.initiateOAuthLogin(OAuthProvider.GOOGLE);
  }

  registerWithFacebook(): void {
    this.authService.initiateOAuthLogin(OAuthProvider.FACEBOOK);
  }
}
