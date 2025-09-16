import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../../core/models/user.interface';
import { ReservationService } from '../../../../core/services/reservation.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { Page } from '../../../../core/models/pagination.interface';
import { ReservationSummaryDto } from '../../../../core/models/reservation.interface';
import { PaymentDetailsDto } from '../../../../core/models/payment.interface';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetail implements OnInit {
  @Input() user!: User;

  statistics: { totalReservations: number; completedReservations: number; totalSpent: number } | null = null;

  constructor(
    private reservationService: ReservationService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    if (!this.user?.id) return;

    // Fetch reservations for this user (admin endpoint with filter)
    this.reservationService.getAllReservations({ userId: this.user.id }, { page: 0, size: 1000 })
      .subscribe((resPage: Page<ReservationSummaryDto>) => {
        const totalReservations = resPage.totalElements;
        const completedReservations = resPage.content.filter(r => r.status === 'COMPLETED').length;

        // Fetch payments for this user to compute total spent
        this.paymentService.getAllPaymentsAdmin({ userId: this.user.id }, { page: 0, size: 1000 })
          .subscribe((payPage: Page<PaymentDetailsDto>) => {
            const totalSpent = payPage.content.reduce((sum, p) => sum + (p.amount || 0), 0);
            this.statistics = { totalReservations, completedReservations, totalSpent };
          });
      });
  }

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
