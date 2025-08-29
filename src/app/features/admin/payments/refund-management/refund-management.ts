import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentDetailsDto } from '../../../../core/models/payment.interface';
import { PaymentStatus } from '../../../../core/enums/payment-status.enum';
import { PaymentService } from '../../../../core/services/payment.service';

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
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.refundForm = this.fb.group({
      refundAmount: [this.payment?.amount || 0, [Validators.required, Validators.min(0.01)]],
      reason: ['', [Validators.required]],
      adminNotes: [''],
      contactEmail: [this.payment?.userEmail || '', [Validators.email]],
      contactPhone: ['']
    });

    // Set max refund amount validation
    if (this.payment?.amount) {
      this.refundForm.get('refundAmount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(this.payment.amount)
      ]);
    }
  }

  onSubmit(): void {
    if (this.refundForm.invalid || this.isSubmitting || !this.payment) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.refundForm.value;

    this.paymentService.processRefund(this.payment.id, {
      amount: formData.refundAmount,
      reason: formData.reason,
      adminNotes: formData.adminNotes,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
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
    return this.payment?.status === PaymentStatus.COMPLETED;
  }

  getMaxRefundAmount(): number {
    return this.payment?.amount || 0;
  }

  isFullRefund(): boolean {
    const refundAmount = this.refundForm.get('refundAmount')?.value;
    return refundAmount === this.payment?.amount;
  }
}
