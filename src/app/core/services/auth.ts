import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, catchError, switchMap, of, delay, retry, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  OAuthLoginRequest,
  OAuthLoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  OAuthProvider,
  JwtResponse
} from '../models/user.interface';

export type UserMode = 'admin' | 'customer';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private currentModeSubject = new BehaviorSubject<UserMode>('customer');
  public currentMode$ = this.currentModeSubject.asObservable();
  
  private isRefreshing = false;
  private isInitializing = false;

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
    this.loadModeFromStorage();
  }

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.handleSuccessfulAuth(response);
        })
      );
  }

  oauthLogin(oauthRequest: OAuthLoginRequest): Observable<OAuthLoginResponse> {
    return this.http.post<OAuthLoginResponse>(`${environment.apiUrl}/auth/oauth`, oauthRequest)
      .pipe(
        tap(response => {
          this.handleSuccessfulAuth(response);
        })
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    // Use the existing UserController endpoint
    return this.http.post<User>(`${environment.apiUrl}/users`, userData);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userMode');
    this.currentUserSubject.next(null);
    this.currentModeSubject.next('customer');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // The simplified isAuthenticated method
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token && !this.isTokenExpired(token);
  }

  // Check if the current user has the 'ADMIN' role.
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.role === 'ADMIN';
  }

  // New method for async authentication check
  isAuthenticatedAsync(): Observable<boolean> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return of(false);
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      this.logout();
      return of(false);
    }

    // If we have a user, return true immediately
    if (this.getCurrentUser()) {
      return of(true);
    }

    // If no user but token exists, validate it
    return this.validateToken().pipe(
      map(user => {
        this.currentUserSubject.next(user);
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  refreshToken(): Observable<LoginResponse> {
    if (this.isRefreshing) {
      return throwError(() => new Error('Token refresh already in progress'));
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.isRefreshing = false;
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.handleSuccessfulAuth(response);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        }),
        tap(() => {
          this.isRefreshing = false;
        })
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, request, { responseType: 'text' as 'json' });
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    // Use the existing UserController endpoint
    const user = this.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }
    return this.http.post<void>(`${environment.apiUrl}/users/${user.id}/change-password`, request);
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const user = this.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }
    return this.http.put<User>(`${environment.apiUrl}/users/${user.id}`, userData)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        })
      );
  }

  initiateOAuthLogin(provider: OAuthProvider): void {
    const redirectUri = `${window.location.origin}/auth/oauth-callback`;
    const oauthUrl = `${environment.apiUrl}/auth/oauth/${provider.toLowerCase()}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = oauthUrl;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    console.log('Setting tokens in localStorage');
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  setCurrentUserEmail(email: string): void {
    console.log('Setting current user email:', email);

    // Create a basic user object with email for OAuth users
    // This will be replaced when the full user data is fetched
    const basicUser: User = {
      id: 0, // Temporary ID
      email: email,
      firstName: email.split('@')[0], // Use email prefix as first name
      lastName: '',
      role: 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Created basic user object:', basicUser);
    this.currentUserSubject.next(basicUser);

    // Try to fetch full user data
    this.validateToken().subscribe({
      next: (user) => {
        console.log('Fetched full user data:', user);
        this.currentUserSubject.next(user);
      },
      error: (err) => {
        console.warn('Could not fetch full user data, keeping basic user:', err);
        // Keep the basic user object
      }
    });
  }

  private handleSuccessfulAuth(response: LoginResponse | OAuthLoginResponse | JwtResponse): void {
    console.log('Handling successful authentication:', response);

    // Store tokens
    localStorage.setItem('accessToken', response.accessToken);
    if ('refreshToken' in response) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    // Update user state
    if ('user' in response && response.user) {
      console.log('Setting current user:', response.user);
      this.currentUserSubject.next(response.user);
    } else {
      console.warn('No user data in response, attempting to fetch user info');
      // If no user data, try to fetch it
      this.validateToken().subscribe({
        next: (user) => {
          console.log('Fetched user data:', user);
          this.currentUserSubject.next(user);
        },
        error: (err) => {
          console.error('Failed to fetch user data:', err);
          // Create a basic user object if we have email
          if (response.accessToken) {
            const basicUser: User = {
              id: 0,
              email: 'user@example.com', // Placeholder
              firstName: 'User',
              lastName: '',
              role: 'CUSTOMER',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            this.currentUserSubject.next(basicUser);
          }
        }
      });
    }
  }

  private loadUserFromStorage(): void {
    if (this.isInitializing) return;

    this.isInitializing = true;
    const token = localStorage.getItem('accessToken');

    if (token) {
      // Check if token is expired before making the request
      if (this.isTokenExpired(token)) {
        console.log('Token expired, logging out');
        this.logout();
        this.isInitializing = false;
        return;
      }

      this.validateToken().pipe(
        retry({ count: 2, delay: 1000 }), // Retry up to 2 times with 1 second delay
        catchError((error) => {
          console.warn('Token validation failed, attempting refresh:', error);
          // Try to refresh the token instead of immediately logging out
          return this.refreshToken().pipe(
            switchMap((refreshResponse) => {
              // After refresh, validate the new token to get user data
              return this.validateToken();
            }),
            catchError((refreshError) => {
              console.error('Token refresh failed, logging out:', refreshError);
              this.logout();
              return throwError(() => refreshError);
            })
          );
        })
      ).subscribe({
        next: (user) => {
          console.log('User loaded from storage:', user);
          this.currentUserSubject.next(user);
          this.isInitializing = false;
        },
        error: (error) => {
          console.error('Failed to load user from storage:', error);
          this.isInitializing = false;
        }
      });
    } else {
      this.isInitializing = false;
    }
  }

  private validateToken(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`);
  }

  // New method to check if JWT token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      // Add 5 minute buffer to prevent edge cases
      return currentTime >= (expirationTime - (5 * 60 * 1000));
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Consider invalid tokens as expired
    }
  }

  // Mode management methods
  getCurrentMode(): UserMode {
    return this.currentModeSubject.value;
  }

  isAdminMode(): boolean {
    return this.isAdmin() && this.getCurrentMode() === 'admin';
  }

  isCustomerMode(): boolean {
    return !this.isAdmin() || this.getCurrentMode() === 'customer';
  }

  switchToAdminMode(): void {
    if (this.isAdmin()) {
      this.currentModeSubject.next('admin');
      localStorage.setItem('userMode', 'admin');
    }
  }

  switchToCustomerMode(): void {
    this.currentModeSubject.next('customer');
    localStorage.setItem('userMode', 'customer');
  }

  private loadModeFromStorage(): void {
    const savedMode = localStorage.getItem('userMode') as UserMode;
    if (savedMode && (savedMode === 'admin' || savedMode === 'customer')) {
      this.currentModeSubject.next(savedMode);
    }
  }
}
