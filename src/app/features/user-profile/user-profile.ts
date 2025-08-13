import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { User } from '../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  loading = false;
  saving = false;

  // Form data
  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  };

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    
    // Test toast functionality
    setTimeout(() => {
      this.toastr.info('Profile page loaded successfully!', 'Info');
    }, 1000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  private loadUserProfile(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.toastr.error('User not authenticated', 'Error');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Initialize form data
    this.editForm = {
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      email: this.user.email || '',
      phoneNumber: this.user.phoneNumber || ''
    };
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    // Reset form to original values
    this.editForm = {
      firstName: this.user?.firstName || '',
      lastName: this.user?.lastName || '',
      email: this.user?.email || '',
      phoneNumber: this.user?.phoneNumber || ''
    };
  }

  saveProfile(): void {
    if (!this.user) return;

    this.saving = true;

    const updateData = {
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      phoneNumber: this.editForm.phoneNumber
    };

    console.log('Attempting to update profile with data:', updateData);

    this.authService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        console.log('Profile updated successfully:', updatedUser);
        this.user = updatedUser;
        this.isEditing = false;
        this.saving = false;
        
        console.log('Showing success toast...');
        this.toastr.success('Profile updated successfully!', 'Success');

        // Update form data
        this.editForm = {
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          email: updatedUser.email || '',
          phoneNumber: updatedUser.phoneNumber || ''
        };
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.saving = false;
        
        console.log('Showing error toast...');
        this.toastr.error(error.error?.message || 'Failed to update profile', 'Error');
      }
    });
  }

  changePassword(): void {
    // Navigate to change password page or show modal
    this.toastr.info('Change password functionality coming soon!', 'Info');
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.toastr.info('Account deletion functionality coming soon!', 'Info');
    }
  }

  getAuthProviderDisplayName(): string {
    if (!this.user?.authProvider) return 'Email';

    switch (this.user.authProvider) {
      case 'GOOGLE':
        return 'Google';
      case 'FACEBOOK':
        return 'Facebook';
      case 'LOCAL':
        return 'Email/Password';
      default:
        return 'Email';
    }
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'ADMIN';
  }
}
