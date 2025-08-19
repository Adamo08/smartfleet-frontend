import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LoginRequest, OAuthProvider } from '../../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';
import { filter, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginData: LoginRequest = {
    email: '',
    password: ''
  };
  
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginData)
      .pipe(
        // Ensure user is loaded after token is stored
        switchMap(() => this.authService.isAuthenticatedAsync()),
        switchMap(() => this.authService.currentUser$),
        filter((u): u is NonNullable<typeof u> => !!u),
        take(1)
      )
      .subscribe({
        next: () => {
          this.toastr.success('Login successful!', 'Welcome back!');
          const isAdmin = this.authService.isAdmin();
          if (isAdmin) {
            this.authService.switchToAdminMode();
            this.router.navigate(['/admin']);
          } else {
            this.authService.switchToCustomerMode();
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          this.error = error.error?.message || 'Invalid credentials';
          this.loading = false;
        }
      });
  }

  loginWithGoogle(): void {
    this.authService.initiateOAuthLogin(OAuthProvider.GOOGLE);
  }

  loginWithFacebook(): void {
    this.authService.initiateOAuthLogin(OAuthProvider.FACEBOOK);
  }
}
