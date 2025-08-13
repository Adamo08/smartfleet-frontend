import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth';
import { interval, Subscription } from 'rxjs';
import { filter, switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  constructor(private authService: AuthService) {
    this.startTokenRefreshTimer();
  }

  private startTokenRefreshTimer(): void {
    // Check every 5 minutes if token needs refresh
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).pipe(
      filter(() => this.authService.isAuthenticated()),
      switchMap(() => {
        const token = this.authService.getAccessToken();
        if (token && this.isTokenExpiringSoon(token)) {
          console.log('Token expiring soon, refreshing...');
          return this.authService.refreshToken();
        }
        return [];
      }),
      catchError(error => {
        console.error('Automatic token refresh failed:', error);
        return [];
      })
    ).subscribe();
  }

  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh if token expires in less than 15 minutes
      return timeUntilExpiry < (15 * 60 * 1000);
    } catch (error) {
      console.error('Error parsing token for expiry check:', error);
      return true; // Consider invalid tokens as needing refresh
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
}
