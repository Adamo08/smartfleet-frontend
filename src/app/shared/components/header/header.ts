import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
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
  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }
}
