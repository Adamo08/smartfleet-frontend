import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-cancel.html',
  styleUrl: './payment-cancel.css'
})
export class PaymentCancel {
  constructor(private router: Router) {}

  onGoToReservations(): void {
    this.router.navigate(['/reservations']);
  }

  onGoToPayments(): void {
    this.router.navigate(['/payments']);
  }

  onTryAgain(): void {
    // Go back to the previous page
    window.history.back();
  }
}
