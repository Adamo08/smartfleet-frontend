import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { RefundDetailsDto } from '../../../core/models/payment.interface';
import { RefundStatus } from '../../../core/enums/refund-status.enum';

@Component({
  selector: 'app-refund-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './refund-detail.html',
  styleUrl: './refund-detail.css'
})
export class RefundDetail implements OnInit, OnDestroy {
  refundId?: number;
  refund: RefundDetailsDto | null = null;
  loading: boolean = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  // Expose RefundStatus enum to template
  readonly RefundStatus = RefundStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.refundId = +params['id'];
      if (this.refundId) {
        this.loadRefundDetails();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRefundDetails(): void {
    if (!this.refundId) return;
    
    this.loading = true;
    this.error = null;
    
    this.paymentService.getRefundDetails(this.refundId).subscribe({
      next: (refund) => {
        this.refund = refund;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading refund details:', error);
        this.error = 'Failed to load refund details';
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/payments/refunds']);
  }

  onViewPayment(): void {
    if (this.refund?.paymentId) {
      this.router.navigate(['/payments', this.refund.paymentId]);
    }
  }

  getStatusBadgeClass(status: RefundStatus): string {
    switch (status) {
      case RefundStatus.PROCESSED:
        return 'bg-green-500';
      case RefundStatus.PENDING:
        return 'bg-yellow-500';
      case RefundStatus.FAILED:
        return 'bg-red-500';
      case RefundStatus.CANCELLED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: RefundStatus): string {
    switch (status) {
      case RefundStatus.PROCESSED:
        return 'Processed';
      case RefundStatus.PENDING:
        return 'Pending';
      case RefundStatus.FAILED:
        return 'Failed';
      case RefundStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
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
}
