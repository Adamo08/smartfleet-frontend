import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css'
})
export class PaymentSuccess implements OnInit {
  sessionId: string | null = null;
  loading: boolean = false;
  success: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    console.log('=== PAYMENT SUCCESS COMPONENT INITIALIZED ===');
    this.route.queryParams.subscribe(params => {
      console.log('Query parameters received:', params);
      
      // Handle both sessionId (for direct payments) and PayPal parameters
      this.sessionId = params['sessionId'] || params['token'];
      console.log('Session ID/Token:', this.sessionId);
      
      if (this.sessionId) {
        console.log('Confirming payment with session ID:', this.sessionId);
        this.confirmPayment();
      } else if (params['status'] === 'success') {
        console.log('Handling PayPal success with token:', params['token'], 'PayerID:', params['PayerID']);
        // PayPal success - we need to handle this differently
        this.handlePayPalSuccess(params['token'], params['PayerID']);
      } else {
        console.error('No session ID or payment token provided');
        this.error = 'No session ID or payment token provided';
      }
    });
  }

  private confirmPayment(): void {
    console.log('Starting payment confirmation for session ID:', this.sessionId);
    this.loading = true;
    this.paymentService.confirmPayment(this.sessionId!).subscribe({
      next: (response) => {
        console.log('Payment confirmation successful:', response);
        this.loading = false;
        this.success = true;
        this.toastr.success('Payment confirmed successfully!');
        
        // Redirect to reservations after a short delay
        setTimeout(() => {
          this.router.navigate(['/reservations']);
        }, 3000);
      },
      error: (error) => {
        console.error('Payment confirmation error:', error);
        this.loading = false;
        this.error = 'Failed to confirm payment. Please contact support.';
        this.toastr.error('Payment confirmation failed');
      }
    });
  }

  private handlePayPalSuccess(token: string, payerId: string): void {
    console.log('Handling PayPal success - Token:', token, 'PayerID:', payerId);
    this.loading = true;
    // For PayPal, we need to capture the payment using the token
    // This will be handled by the backend when PayPal redirects back
    this.success = true;
    this.loading = false;
    this.toastr.success('PayPal payment successful!');
    
    // Redirect to reservations after a short delay
    setTimeout(() => {
      this.router.navigate(['/reservations']);
    }, 3000);
  }

  onGoToReservations(): void {
    this.router.navigate(['/reservations']);
  }

  onGoToPayments(): void {
    this.router.navigate(['/payments']);
  }
}
