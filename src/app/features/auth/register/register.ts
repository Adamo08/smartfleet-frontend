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
        this.error = err.error.message;
      }
    });
  }


  private validateForm(): boolean {
    // Reset error on new validation attempt
    this.error = '';

    if (!this.registerData.email || !this.registerData.password ||
      !this.registerData.firstName || !this.registerData.lastName || !this.registerData.phoneNumber) {
      this.error = 'Please fill in all required fields';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.error = 'Please enter a valid email address';
      return false;
    }

    const phoneRegex = /^0[76][0-9]{8}$/;
    if (!phoneRegex.test(this.registerData.phoneNumber)) {
      this.error = 'Invalid phone number format. Phone number must start with 06 or 07 and be followed by 8 digits';
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
