import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { WebSocketService } from '../../../core/services/websocket';
import { User } from '../../../core/models/user.interface';
import { NotificationBell } from '../../../features/notifications/notification-bell/notification-bell';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBell],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketService.disconnect();
  }

  private loadUserData(): void {
    // Load initial notification data
    this.notificationService.loadInitialData();

    // Initialize WebSocket connection for real-time notifications
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.email) {
      this.webSocketService.connect(currentUser.email).then(() => {
        console.log('WebSocket connected for header notifications');
      }).catch(error => {
        console.error('Failed to connect WebSocket from header:', error);
      });
    }
  }

  logout(): void {
    // Disconnect WebSocket before logout
    this.webSocketService.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  navigateToBookmarks(): void {
    this.router.navigate(['/bookmarks']);
  }

  navigateToFavorites(): void {
    this.router.navigate(['/favorites']);
  }
}
