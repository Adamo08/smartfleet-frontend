import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { User, ChangePasswordRequest } from '../../core/models/user.interface';
import { ToastrService } from 'ngx-toastr';
import { ConfigrmDialog, DialogActionType } from '../../shared/components/configrm-dialog/configrm-dialog';
import { ChangePasswordModal } from '../../shared/components/change-password-modal/change-password-modal';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { environment } from '../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfigrmDialog, ChangePasswordModal],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  user: User | null = null;
  isEditing = false;
  loading = false;
  saving = false;

  // Stats
  stats: any | null = null;
  chartData: { months: string[]; reservations: number[]; spending: number[] } | null = null;
  private reservationsChart?: Chart;
  private spendingChart?: Chart;

  @ViewChild('userReservationsChart') userReservationsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('userSpendingChart') userSpendingChartRef!: ElementRef<HTMLCanvasElement>;

  // Form data
  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  };

  // Modal states
  showChangePasswordModal = false;
  showDeleteConfirmDialog = false;

  // Expose enum to template
  DialogActionType = DialogActionType;

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data arrives
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  private loadStats(): void {
    this.authService.getMyStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.tryRenderCharts();
      },
      error: () => {
        // fail silently to avoid breaking profile
        this.stats = null;
      }
    });

    // Load series for charts
    this.authService
      .get<any>(`${environment.apiUrl}/users/me/activity-series` as any)
      ?.subscribe?.({
        next: (series: any) => {
          this.chartData = {
            months: series.months,
            reservations: series.monthlyReservationCounts,
            spending: series.monthlySpending
          };
        },
        error: () => {
          this.chartData = null;
        }
      } as any);
  }

  private tryRenderCharts(): void {
    if (!this.chartData) return;
    setTimeout(() => {
      this.renderReservationsChart();
      this.renderSpendingChart();
    }, 50);
  }

  private renderReservationsChart(): void {
    const el = this.userReservationsChartRef?.nativeElement;
    if (!el || !this.chartData) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    if (this.reservationsChart) this.reservationsChart.destroy();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.chartData.months,
        datasets: [{
          label: 'Reservations',
          data: this.chartData.reservations,
          backgroundColor: '#93C5FD',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
        }
      }
    };

    this.reservationsChart = new Chart(ctx, config);
  }

  private renderSpendingChart(): void {
    const el = this.userSpendingChartRef?.nativeElement;
    if (!el || !this.chartData) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    if (this.spendingChart) this.spendingChart.destroy();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.chartData.months,
        datasets: [{
          label: 'Spending',
          data: this.chartData.spending,
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
        }
      }
    };

    this.spendingChart = new Chart(ctx, config);
  }

  ngOnDestroy(): void {
    if (this.reservationsChart) this.reservationsChart.destroy();
    if (this.spendingChart) this.spendingChart.destroy();
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
    this.showChangePasswordModal = true;
  }

  onPasswordChangeRequested(request: ChangePasswordRequest): void {
    this.authService.changePassword(request).subscribe({
      next: () => {
        this.toastr.success('Password changed successfully!', 'Success');
        this.showChangePasswordModal = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        const errorMessage = error.error?.message || 'Failed to change password';
        this.toastr.error(errorMessage, 'Error');
        // You can access the modal component to set error if needed
      }
    });
  }

  onChangePasswordModalClosed(): void {
    this.showChangePasswordModal = false;
  }

  deleteAccount(): void {
    this.showDeleteConfirmDialog = true;
  }

  onDeleteAccountConfirmed(): void {
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.toastr.success('Account deleted successfully', 'Success');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        const errorMessage = error.error?.message || 'Failed to delete account';
        this.toastr.error(errorMessage, 'Error');
        this.showDeleteConfirmDialog = false;
      }
    });
  }

  onDeleteAccountCancelled(): void {
    this.showDeleteConfirmDialog = false;
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
