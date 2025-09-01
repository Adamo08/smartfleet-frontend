import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentDto, RefundRequestDto, RefundReason, RefundMethod } from '../../../core/models/payment.interface';
import { SuccessModalService } from '../../../shared/services/success-modal.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-refund-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './refund-request.html',
  styleUrl: './refund-request.css'
})
export class RefundRequest implements OnInit {
  refundForm: FormGroup;
  payment: PaymentDto | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  paymentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute,
    private successModalService: SuccessModalService,
    private toastr: ToastrService
  ) {
    this.refundForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      reason: ['', [Validators.required]],
      refundMethod: [RefundMethod.ORIGINAL_PAYMENT_METHOD, Validators.required],
      additionalNotes: [''],
      contactEmail: ['', [Validators.email]],
      contactPhone: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['paymentId'] ? Number(params['paymentId']) : null;
      if (this.paymentId) {
        this.loadPayment();
      } else {
        this.error = 'Payment ID is required';
      }
    });
  }

  loadPayment(): void {
    if (!this.paymentId) return;

    this.loading = true;
    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.refundForm.patchValue({
          amount: payment.amount // Default to full refund
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        this.error = 'Failed to load payment details';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.refundForm.invalid || !this.payment) return;

    this.submitting = true;
    
    const refundRequest: RefundRequestDto = {
      paymentId: this.payment.id,
      amount: this.refundForm.value.amount,
      reason: this.refundForm.value.reason,
      refundMethod: this.refundForm.value.refundMethod,
      additionalNotes: this.refundForm.value.additionalNotes,
      contactEmail: this.refundForm.value.contactEmail,
      contactPhone: this.refundForm.value.contactPhone
    };

    this.paymentService.requestRefund(refundRequest).subscribe({
      next: (response) => {
        this.successModalService.showOperationSuccess(
          'Refund request submitted successfully',
          `Your refund request for ${this.formatCurrency(refundRequest.amount)} has been submitted and is awaiting admin approval. You will be notified once it's reviewed.`
        );
        this.router.navigate(['/payments/history']);
      },
      error: (error) => {
        console.error('Error requesting refund:', error);
        this.toastr.error('Failed to submit refund request. Please try again.');
        this.submitting = false;
      }
    });
  }

  canRequestFullRefund(): boolean {
    return this.payment?.status === 'COMPLETED' || this.payment?.status === 'PARTIALLY_REFUNDED';
  }

  setFullRefund(): void {
    if (this.payment) {
      // Calculate remaining refundable amount
      const refundedAmount = (this.payment as any).refundedAmount || 0;
      const remainingAmount = this.payment.amount - refundedAmount;
      this.refundForm.patchValue({
        amount: remainingAmount
      });
    }
  }

  setPartialRefund(percentage: number): void {
    if (this.payment) {
      // Calculate remaining refundable amount
      const refundedAmount = (this.payment as any).refundedAmount || 0;
      const remainingAmount = this.payment.amount - refundedAmount;
      const amount = (remainingAmount * percentage / 100);
      this.refundForm.patchValue({
        amount: amount.toFixed(2)
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.payment?.currency || 'USD'
    }).format(amount);
  }

  getMaxRefundAmount(): number {
    if (!this.payment) return 0;
    const refundedAmount = (this.payment as any).refundedAmount || 0;
    return this.payment.amount - refundedAmount;
  }

  getRefundedAmount(): number {
    if (!this.payment) return 0;
    return (this.payment as any).refundedAmount || 0;
  }

  getRefundReasons(): { value: RefundReason; label: string }[] {
    return [
      { value: RefundReason.VEHICLE_UNAVAILABLE, label: 'Vehicle became unavailable' },
      { value: RefundReason.CANCELLATION_BY_CUSTOMER, label: 'Customer cancelled reservation' },
      { value: RefundReason.TECHNICAL_ISSUE, label: 'Technical issue with booking' },
      { value: RefundReason.DUPLICATE_PAYMENT, label: 'Duplicate payment made' },
      { value: RefundReason.WRONG_AMOUNT, label: 'Incorrect amount charged' },
      { value: RefundReason.SERVICE_NOT_PROVIDED, label: 'Service not provided as expected' },
      { value: RefundReason.EMERGENCY_CANCELLATION, label: 'Emergency cancellation' },
      { value: RefundReason.WEATHER_CONDITIONS, label: 'Weather conditions prevented service' },
      { value: RefundReason.VEHICLE_DAMAGE, label: 'Vehicle damage before rental' },
      { value: RefundReason.OTHER, label: 'Other reason' }
    ];
  }

  getRefundMethods(): { value: RefundMethod; label: string }[] {
    return [
      { value: RefundMethod.ORIGINAL_PAYMENT_METHOD, label: 'Original Payment Method' },
      { value: RefundMethod.PAYPAL, label: 'PayPal' },
      { value: RefundMethod.ONSITE_CASH, label: 'On-site Cash Refund' }
    ];
  }

  goBack(): void {
    this.router.navigate(['/payments/history']);
  }
}