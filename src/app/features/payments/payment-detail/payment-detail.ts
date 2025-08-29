import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentDto } from '../../../core/models/payment.interface';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-detail.html',
  styleUrl: './payment-detail.css'
})
export class PaymentDetail implements OnInit, OnDestroy {
  paymentId?: number;
  payment: PaymentDto | null = null;
  loading: boolean = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.paymentId = +params['id'];
      if (this.paymentId) {
        this.loadPaymentDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPaymentDetails(): void {
    if (!this.paymentId) return;
    
    this.loading = true;
    this.error = null;
    
    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment details:', error);
        this.error = 'Failed to load payment details';
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/payments']);
  }

  onRequestRefund(): void {
    if (!this.payment) return;
    
    this.router.navigate(['/payments/refund-request'], { 
      queryParams: { paymentId: this.payment.id } 
    });
  }

  canRequestRefund(): boolean {
    return this.payment?.status === 'COMPLETED';
  }

  formatCurrency(amount: number, currency?: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PENDING': return 'Pending';
      case 'FAILED': return 'Failed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }
}
