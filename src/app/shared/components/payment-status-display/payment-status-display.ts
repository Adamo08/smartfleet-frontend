import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaymentStatusInfo {
  status: string;
  amount: number;
  currency: string;
  transactionId?: string;
  processedAt?: Date;
  method?: string;
}

@Component({
  selector: 'app-payment-status-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-status-display.html',
  styleUrl: './payment-status-display.css'
})
export class PaymentStatusDisplay {
  @Input() paymentInfo!: PaymentStatusInfo;
  @Input() showActions: boolean = true;
  
  @Output() onRetry = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  getStatusBadgeClass(): string {
    const status = this.paymentInfo.status.toLowerCase();
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'succeeded':
        return 'status-completed';
      case 'pending':
      case 'processing':
        return 'status-pending';
      case 'failed':
      case 'declined':
        return 'status-failed';
      case 'cancelled':
      case 'canceled':
        return 'status-cancelled';
      case 'refunded':
        return 'status-refunded';
      default:
        return 'status-pending';
    }
  }

  getStatusText(): string {
    const status = this.paymentInfo.status.toLowerCase();
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'succeeded':
        return 'Completed';
      case 'pending':
      case 'processing':
        return 'Pending';
      case 'failed':
      case 'declined':
        return 'Failed';
      case 'cancelled':
      case 'canceled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return this.paymentInfo.status;
    }
  }

  getMethodDisplayName(method: string): string {
    const methodMap: { [key: string]: string } = {
      'paypal': 'PayPal',

      'onsite': 'On-Site Payment',
      'credit-card': 'Credit Card',
      'debit-card': 'Debit Card'
    };
    return methodMap[method.toLowerCase()] || method;
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canRetry(): boolean {
    const status = this.paymentInfo.status.toLowerCase();
    return status === 'failed' || status === 'declined';
  }

  canCancel(): boolean {
    const status = this.paymentInfo.status.toLowerCase();
    return status === 'pending' || status === 'processing';
  }
}

