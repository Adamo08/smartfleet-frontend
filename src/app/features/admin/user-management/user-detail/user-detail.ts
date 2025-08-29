import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../../core/models/user.interface';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetail {
  @Input() user!: User;

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'CUSTOMER':
        return 'Customer';
      case 'GUEST':
        return 'Guest';
      default:
        return role;
    }
  }

  getAuthProviderDisplayName(provider: string | null): string {
    if (!provider || provider === 'LOCAL') {
      return 'Local Account';
    }
    return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
  }
}
