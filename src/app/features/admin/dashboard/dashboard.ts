import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  switchToCustomerMode(): void {
    this.authService.switchToCustomerMode();
    this.router.navigate(['/']);
  }
}
