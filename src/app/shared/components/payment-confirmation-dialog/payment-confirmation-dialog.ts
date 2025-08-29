import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '../modal/modal';

export interface PaymentConfirmationData {
  reservationId: number;
  amount: number;
  currency: string;
  vehicleInfo: string;
  startDate: Date;
  endDate: Date;
  duration: string;
  paymentMethod: string;
}

@Component({
  selector: 'app-payment-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './payment-confirmation-dialog.html',
  styleUrl: './payment-confirmation-dialog.css'
})
export class PaymentConfirmationDialog {
  @Input() isOpen: boolean = false;
  @Input() confirmationData!: PaymentConfirmationData;
  @Input() isProcessing: boolean = false;
  @Input() errorMessage: string | null = null;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  termsAccepted: boolean = false;

  confirmPayment(): void {
    if (!this.termsAccepted) {
      return;
    }
    
    this.onConfirm.emit();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
}

