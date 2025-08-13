import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RegisterRequest, OAuthProvider } from '../../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';

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
      next: () => {
        this.toastr.success('Registration successful! Please log in.', 'Account created!');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.error = error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private validateForm(): boolean {
    if (!this.registerData.email || !this.registerData.password || 
        !this.registerData.firstName || !this.registerData.lastName) {
      this.error = 'Please fill in all required fields';
      return false;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.error = 'Please enter a valid email address';
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
