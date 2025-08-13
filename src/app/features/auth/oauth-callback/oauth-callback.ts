import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { OAuthProvider } from '../../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.css'
})
export class OAuthCallbackComponent implements OnInit {
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private handleOAuthCallback(): void {
    // Check for error first
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.handleOAuthError(error);
      return;
    }

    // Check for tokens (successful OAuth flow)
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken') ?? '';
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken') ?? '';
    const provider = this.route.snapshot.queryParamMap.get('provider') ?? '';
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';

    if (accessToken && refreshToken && provider) {
      this.handleSuccessfulOAuth(accessToken, refreshToken, provider, email);
      return;
    }

    // Fallback: check for authorization code (legacy flow)
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code && provider) {
      this.handleLegacyOAuthFlow(code, provider);
      return;
    }

    // No valid parameters found
    this.error = 'Invalid OAuth callback parameters';
    this.loading = false;
    this.toastr.error('Invalid OAuth callback parameters', 'Error');
    setTimeout(() => this.router.navigate(['/auth/login']), 3000);
  }

  private handleOAuthError(error: string): void {
    let errorMessage = 'OAuth authentication failed';

    switch (error) {
      case 'email_not_provided':
        errorMessage = 'Email not provided by OAuth provider';
        break;
      case 'unsupported_provider':
        errorMessage = 'Unsupported OAuth provider';
        break;
      default:
        errorMessage = `OAuth error: ${error}`;
    }

    this.error = errorMessage;
    this.loading = false;
    this.toastr.error(errorMessage, 'Error');
    setTimeout(() => this.router.navigate(['/auth/login']), 3000);
  }

  private handleSuccessfulOAuth(accessToken: string, refreshToken: string, provider: string, email?: string): void {
    // Store tokens in the auth service
    this.authService.setTokens(accessToken, refreshToken);

    // Set user info if available
    if (email) {
      // You might want to fetch full user details here or store basic info
      this.authService.setCurrentUserEmail(email);
    }

    this.loading = false;
    this.toastr.success('OAuth authentication successful!', 'Welcome!');

    // Navigate to home or dashboard
    this.router.navigate(['/']).then(r => console.log("Navigating to home..."));
  }

  private handleLegacyOAuthFlow(code: string, provider: string): void {
    // Legacy flow: exchange code for tokens
    const redirectUri = `${window.location.origin}/auth/oauth-callback`;

    let oauthProvider: OAuthProvider;
    if (provider.toLowerCase() === 'google') {
      oauthProvider = OAuthProvider.GOOGLE;
    } else if (provider.toLowerCase() === 'facebook') {
      oauthProvider = OAuthProvider.FACEBOOK;
    } else {
      this.error = 'Unsupported OAuth provider';
      this.loading = false;
      this.toastr.error('Unsupported OAuth provider', 'Error');
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      return;
    }

    this.authService.oauthLogin({
      provider: oauthProvider,
      code: code,
      redirectUri: redirectUri
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.isNewUser) {
          this.toastr.success('Account created successfully!', 'Welcome!');
        } else {
          this.toastr.success('Login successful!', 'Welcome back!');
        }
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'OAuth authentication failed';
        this.toastr.error('OAuth authentication failed', 'Error');
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      }
    });
  }
}
