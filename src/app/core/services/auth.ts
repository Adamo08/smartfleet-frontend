import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError, catchError, switchMap } from 'rxjs';
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
  OAuthProvider
} from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isRefreshing = false;

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
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
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser() && !!localStorage.getItem('accessToken');
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
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

  private handleSuccessfulAuth(response: LoginResponse | OAuthLoginResponse): void {
    console.log('Handling successful authentication:', response);

    // Store tokens
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    // Update user state
    if (response.user) {
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
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.validateToken().subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  private validateToken(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`);
  }
}
