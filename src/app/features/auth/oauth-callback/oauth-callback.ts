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
    // Add a small delay to ensure the component is fully rendered
    setTimeout(() => {
      this.handleOAuthCallback();
    }, 100);
  }

  private handleOAuthCallback(): void {
    console.log('OAuth callback component initialized');
    
    // Check for error first
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      console.log('OAuth error detected:', error);
      this.handleOAuthError(error);
      return;
    }

    // Check for tokens (successful OAuth flow)
    const accessToken = this.route.snapshot.queryParamMap.get('accessToken') ?? '';
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken') ?? '';
    const provider = this.route.snapshot.queryParamMap.get('provider') ?? '';
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';

    console.log('OAuth callback params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, provider, email });

    if (accessToken && refreshToken && provider) {
      console.log('Processing successful OAuth flow');
      this.handleSuccessfulOAuth(accessToken, refreshToken, provider, email);
      return;
    }

    // Fallback: check for authorization code (legacy flow)
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code && provider) {
      console.log('Processing legacy OAuth flow with code');
      this.handleLegacyOAuthFlow(code, provider);
      return;
    }

    // No valid parameters found
    console.log('No valid OAuth parameters found');
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
    console.log('OAuth error handled:', errorMessage);
    this.toastr.error(errorMessage, 'Error');
    setTimeout(() => this.router.navigate(['/auth/login']), 3000);
  }

  private handleSuccessfulOAuth(accessToken: string, refreshToken: string, provider: string, email?: string): void {
    console.log('Handling successful OAuth authentication');
    
    try {
      // Store tokens in the auth service
      this.authService.setTokens(accessToken, refreshToken);
      
      // Set user info if available
      if (email) {
        this.authService.setCurrentUserEmail(email);
      }

      this.loading = false;
      console.log('OAuth authentication successful, showing success message');
      
      // Show success message and navigate after a delay
      this.toastr.success('OAuth authentication successful!', 'Welcome!');
      
      setTimeout(() => {
        console.log('Navigating to appropriate page based on role');
        this.authService.isAuthenticatedAsync().subscribe(() => {
          const isAdmin = this.authService.isAdmin();
          if (isAdmin) {
            this.authService.switchToAdminMode();
            this.router.navigate(['/admin']).then(r => console.log('Navigation result:', r));
          } else {
            this.authService.switchToCustomerMode();
            this.router.navigate(['/']).then(r => console.log('Navigation result:', r));
          }
        });
      }, 1500);
      
    } catch (err) {
      console.error('Error in successful OAuth flow:', err);
      this.error = 'Failed to complete authentication';
      this.loading = false;
      this.toastr.error('Failed to complete authentication', 'Error');
    }
  }

  private handleLegacyOAuthFlow(code: string, provider: string): void {
    console.log('Handling legacy OAuth flow');
    
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
        console.log('Legacy OAuth flow successful:', response);
        this.loading = false;
        if (response.isNewUser) {
          this.toastr.success('Account created successfully!', 'Welcome!');
        } else {
          this.toastr.success('Login successful!', 'Welcome back!');
        }
        setTimeout(() => {
          const isAdmin = this.authService.isAdmin();
          if (isAdmin) {
            this.authService.switchToAdminMode();
            this.router.navigate(['/admin']);
          } else {
            this.authService.switchToCustomerMode();
            this.router.navigate(['/']);
          }
        }, 1500);
      },
      error: (error) => {
        console.error('Legacy OAuth flow error:', error);
        this.loading = false;
        this.error = error.error?.message || 'OAuth authentication failed';
        this.toastr.error('OAuth authentication failed', 'Error');
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      }
    });
  }
}
