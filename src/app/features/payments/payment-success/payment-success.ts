import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css'
})
export class PaymentSuccess {
  @Input() paymentId?: number;
  @Input() amount?: number;
  @Input() currency: string = 'USD';
  transactionDate: Date = new Date();

  constructor(private router: Router) {}

  onViewReservation(): void {
    // Navigate to reservation details
    this.router.navigate(['/reservations']);
  }

  onGoHome(): void {
    this.router.navigate(['/']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }
}
