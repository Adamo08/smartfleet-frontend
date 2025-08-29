import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { RefundRequestDto, RefundResponseDto } from '../../../core/models/payment.interface';

@Component({
  selector: 'app-refund-request',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './refund-request.html',
  styleUrl: './refund-request.css'
})
export class RefundRequest implements OnInit, OnDestroy {
  paymentId?: number;
  payment: any = null;
  loading: boolean = false;
  error: string | null = null;
  success: boolean = false;
  
  refundForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.refundForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      refundMethod: ['original', [Validators.required]],
      additionalNotes: ['', [Validators.maxLength(1000)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]]
    });
  }

  ngOnInit(): void {
    this.paymentId = Number(this.route.snapshot.queryParamMap.get('paymentId'));
    if (this.paymentId) {
      this.loadPaymentDetails();
    } else {
      this.error = 'Payment ID is required';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPaymentDetails(): void {
    this.loading = true;
    this.error = null;

    if (this.paymentId) {
      this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment) => {
        this.payment = payment;

        // Pre-fill the amount field
        this.refundForm.patchValue({
          amount: payment.amount
        });

        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading payment details:', error);
        this.error = 'Failed to load payment details';
        this.loading = false;
      }
    });
    } else {
      this.error = 'No payment ID provided';
      this.loading = false;
    }
  }

  onSubmit(): void {
    if (this.refundForm.valid && this.paymentId) {
      this.loading = true;
      this.error = null;

      const refundRequest: RefundRequestDto = {
        paymentId: this.paymentId,
        reason: this.refundForm.get('reason')?.value,
        amount: this.refundForm.get('amount')?.value,
        refundMethod: this.refundForm.get('refundMethod')?.value,
        additionalNotes: this.refundForm.get('additionalNotes')?.value,
        contactEmail: this.refundForm.get('contactEmail')?.value,
        contactPhone: this.refundForm.get('contactPhone')?.value
      };

      this.paymentService.requestRefund(refundRequest).subscribe({
        next: (response: RefundResponseDto) => {
          this.loading = false;
          this.success = true;

          // Navigate back to payment history after a short delay
          setTimeout(() => {
            this.router.navigate(['/payments/history']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error submitting refund request:', error);
          this.error = 'Failed to submit refund request';
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/payments']);
  }

  onBackToPayments(): void {
    this.router.navigate(['/payments']);
  }

  getMaxRefundAmount(): number {
    return this.payment?.amount || 0;
  }

  getRefundReasons(): { value: string; label: string; description: string }[] {
    return [
      { value: 'cancellation', label: 'Reservation Cancellation', description: 'I need to cancel my reservation' },
      { value: 'service_issue', label: 'Service Issue', description: 'There was a problem with the service' },
      { value: 'vehicle_issue', label: 'Vehicle Issue', description: 'The vehicle had problems or was not as described' },
      { value: 'double_charge', label: 'Double Charge', description: 'I was charged multiple times' },
      { value: 'incorrect_amount', label: 'Incorrect Amount', description: 'The amount charged was incorrect' },
      { value: 'other', label: 'Other Reason', description: 'Other reason not listed above' }
    ];
  }

  getRefundMethods(): { value: string; label: string; description: string }[] {
    return [
      { value: 'original', label: 'Original Payment Method', description: 'Refund to the original payment method' },
      { value: 'credit', label: 'Account Credit', description: 'Credit my account for future use' },
      { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer to my bank account' }
    ];
  }

  onReasonChange(): void {
    const reason = this.refundForm.get('reason')?.value;
    if (reason === 'cancellation') {
      // Auto-adjust amount for cancellation (e.g., partial refund)
      this.refundForm.patchValue({
        amount: Math.round(this.payment.amount * 0.8 * 100) / 100 // 80% refund
      });
    } else if (reason === 'double_charge') {
      // Full refund for double charge
      this.refundForm.patchValue({
        amount: this.payment.amount
      });
    }
  }

  get reasonError(): string | null {
    const control = this.refundForm.get('reason');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Reason is required';
      if (control.errors['minlength']) return 'Reason must be at least 10 characters';
      if (control.errors['maxlength']) return 'Reason cannot exceed 500 characters';
    }
    return null;
  }

  get amountError(): string | null {
    const control = this.refundForm.get('amount');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Amount is required';
      if (control.errors['min']) return 'Amount must be greater than 0';
    }
    return null;
  }

  get contactEmailError(): string | null {
    const control = this.refundForm.get('contactEmail');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Contact email is required';
      if (control.errors['email']) return 'Please enter a valid email address';
    }
    return null;
  }

  get contactPhoneError(): string | null {
    const control = this.refundForm.get('contactPhone');
    if (control?.errors && control.touched) {
      if (control.errors['pattern']) return 'Please enter a valid phone number';
    }
    return null;
  }

  get additionalNotesError(): string | null {
    const control = this.refundForm.get('additionalNotes');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) return 'Additional notes cannot exceed 1000 characters';
    }
    return null;
  }

  isFormValid(): boolean {
    return this.refundForm.valid;
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
