import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentDetailsDto, RefundRequestDto, RefundReason, RefundMethod } from '../../../../core/models/payment.interface';
import { PaymentStatus } from '../../../../core/enums/payment-status.enum';
import { PaymentService } from '../../../../core/services/payment.service';
import { SuccessModalService } from '../../../../shared/services/success-modal.service';

@Component({
  selector: 'app-refund-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './refund-management.html',
  styleUrl: './refund-management.css'
})
export class RefundManagement implements OnInit {
  @Input() payment: PaymentDetailsDto | null = null;
  @Output() refundProcessed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  refundForm!: FormGroup;
  isSubmitting = false;
  
  readonly PaymentStatus = PaymentStatus;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private successModalService: SuccessModalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.refundForm = this.fb.group({
      refundAmount: [this.getMaxRefundAmount(), [Validators.required, Validators.min(0.01)]],
      reason: [RefundReason.OTHER, [Validators.required]],
      refundMethod: [RefundMethod.ORIGINAL_PAYMENT_METHOD, [Validators.required]],
      adminNotes: [''],
      contactEmail: [this.payment?.userEmail || '', [Validators.email]],
      contactPhone: ['']
    });

    // Set max refund amount validation
    const maxAmount = this.getMaxRefundAmount();
    if (maxAmount > 0) {
      this.refundForm.get('refundAmount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(maxAmount)
      ]);
    }
  }

  onSubmit(): void {
    if (this.refundForm.invalid || this.isSubmitting || !this.payment) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.refundForm.value;

    const refundRequest: RefundRequestDto = {
      paymentId: this.payment.id,
      amount: formData.refundAmount,
      reason: formData.reason,
      refundMethod: formData.refundMethod,
      additionalNotes: formData.adminNotes,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone
    };

    this.paymentService.requestRefund(refundRequest).subscribe({
      next: () => {
        this.isSubmitting = false;
        const isFullRefund = this.isFullRefund();
        const refundType = isFullRefund ? 'Full' : 'Partial';
        this.successModalService.show({
          title: `${refundType} Refund Processed!`,
          message: `${refundType} refund of $${formData.refundAmount} has been successfully processed.`,
          details: `Payment ID: ${this.payment!.id} | Reason: ${this.getReasonLabel(formData.reason)}`,
          autoClose: true,
          autoCloseDelay: 4000
        });
        this.refundProcessed.emit();
      },
      error: (error) => {
        console.error('Error processing refund:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  canRefund(): boolean {
    return this.payment?.status === PaymentStatus.COMPLETED || this.payment?.status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  getMaxRefundAmount(): number {
    if (!this.payment) return 0;
    const refundedAmount = this.payment.refundedAmount || 0;
    return this.payment.amount - refundedAmount;
  }

  getRemainingAmount(): number {
    if (!this.payment) return 0;
    const refundedAmount = this.payment.refundedAmount || 0;
    return this.payment.amount - refundedAmount;
  }

  getRefundedAmount(): number {
    if (!this.payment) return 0;
    return this.payment.refundedAmount || 0;
  }

  isFullRefund(): boolean {
    const refundAmount = this.refundForm.get('refundAmount')?.value;
    return refundAmount === this.getRemainingAmount();
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

  getReasonLabel(reason: RefundReason): string {
    const reasonObj = this.getRefundReasons().find(r => r.value === reason);
    return reasonObj ? reasonObj.label : reason;
  }
}
