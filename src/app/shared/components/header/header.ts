import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }

  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }
}
