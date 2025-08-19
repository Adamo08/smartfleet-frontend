import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentRequestDto, PaymentResponseDto } from '../../../core/models/payment.interface';
import { PaymentStatus } from '../../../core/enums/payment-status.enum';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css'
})
export class PaymentForm implements OnInit, OnDestroy {
  @Input() reservationId?: number;
  @Input() amount?: number;
  @Input() currency: string = 'USD';
  @Input() disabled: boolean = false;
  
  @Output() paymentSubmitted = new EventEmitter<PaymentResponseDto>();
  @Output() paymentCancelled = new EventEmitter<void>();

  paymentForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  
  paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: '🔵' },
    { id: 'cmi', name: 'CMI (Card)', icon: '💳' },
    { id: 'onsite', name: 'On-site Payment', icon: '🏢' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['paypal', [Validators.required]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
      cardholderName: ['', [Validators.required, Validators.minLength(3)]],
      expiryMonth: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]],
      expiryYear: ['', [Validators.required, Validators.pattern(/^(20[2-9][0-9]|20[3-9][0-9])$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      billingAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      savePaymentMethod: [false],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    this.setupFormListeners();
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormListeners(): void {
    this.paymentForm.get('paymentMethod')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(method => {
      this.updateValidationRules(method);
    });
  }

  private initializeForm(): void {
    if (this.amount) {
      // Pre-fill amount if provided
      this.paymentForm.patchValue({
        amount: this.amount
      });
    }
  }

  private updateValidationRules(method: string): void {
    const cardNumberControl = this.paymentForm.get('cardNumber');
    const cardholderNameControl = this.paymentForm.get('cardholderName');
    const expiryMonthControl = this.paymentForm.get('expiryMonth');
    const expiryYearControl = this.paymentForm.get('expiryYear');
    const cvvControl = this.paymentForm.get('cvv');

    if (method === 'cmi') {
      cardNumberControl?.setValidators([Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]);
      cardholderNameControl?.setValidators([Validators.required, Validators.minLength(3)]);
      expiryMonthControl?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]);
      expiryYearControl?.setValidators([Validators.required, Validators.pattern(/^(20[2-9][0-9]|20[3-9][0-9])$/)]);
      cvvControl?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    } else {
      cardNumberControl?.clearValidators();
      cardholderNameControl?.clearValidators();
      expiryMonthControl?.clearValidators();
      expiryYearControl?.clearValidators();
      cvvControl?.clearValidators();
    }

    cardNumberControl?.updateValueAndValidity();
    cardholderNameControl?.updateValueAndValidity();
    expiryMonthControl?.updateValueAndValidity();
    expiryYearControl?.updateValueAndValidity();
    cvvControl?.updateValueAndValidity();
  }

  onCardNumberInput(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.paymentForm.patchValue({ cardNumber: formattedValue });
  }

  onExpiryMonthChange(event: any): void {
    const value = event.target.value;
    if (value && value.length === 2) {
      const month = parseInt(value);
      if (month < 1 || month > 12) {
        this.paymentForm.get('expiryMonth')?.setErrors({ invalidMonth: true });
      }
    }
  }

  onExpiryYearChange(event: any): void {
    const value = event.target.value;
    if (value && value.length === 4) {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < currentYear || year > currentYear + 20) {
        this.paymentForm.get('expiryYear')?.setErrors({ invalidYear: true });
      }
    }
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.paymentForm.value;
    const paymentRequest: PaymentRequestDto = {
      reservationId: this.reservationId!,
      amount: this.amount!,
      currency: this.currency,
      paymentMethodId: formValue.paymentMethod,
      providerName: this.mapMethodToProvider(formValue.paymentMethod)
    };

    this.paymentService.processPayment(paymentRequest).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (payment) => {
        this.loading = false;
        this.paymentSubmitted.emit(payment);
      },
      error: (error) => {
        console.error('Payment error:', error);
        this.error = 'Payment failed. Please try again.';
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.paymentCancelled.emit();
  }

  get isFormValid(): boolean {
    return this.paymentForm.valid && !this.loading;
  }

  get selectedPaymentMethod(): string {
    return this.paymentForm.get('paymentMethod')?.value || 'paypal';
  }

  private mapMethodToProvider(method: string): string {
    switch (method) {
      case 'paypal':
        return 'paypalPaymentProvider';
      case 'cmi':
        return 'cmiPaymentProvider';
      case 'onsite':
        return 'onSitePaymentProvider';
      default:
        return 'onSitePaymentProvider';
    }
  }

  get cardNumberError(): string | null {
    const control = this.paymentForm.get('cardNumber');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Card number is required';
      if (control.errors['pattern']) return 'Please enter a valid card number';
    }
    return null;
  }

  get cardholderNameError(): string | null {
    const control = this.paymentForm.get('cardholderName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Cardholder name is required';
      if (control.errors['minlength']) return 'Name must be at least 3 characters';
    }
    return null;
  }

  get expiryMonthError(): string | null {
    const control = this.paymentForm.get('expiryMonth');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Expiry month is required';
      if (control.errors['pattern']) return 'Please enter a valid month (01-12)';
      if (control.errors['invalidMonth']) return 'Please enter a valid month';
    }
    return null;
  }

  get expiryYearError(): string | null {
    const control = this.paymentForm.get('expiryYear');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Expiry year is required';
      if (control.errors['pattern']) return 'Please enter a valid year';
      if (control.errors['invalidYear']) return 'Please enter a valid year';
    }
    return null;
  }

  get cvvError(): string | null {
    const control = this.paymentForm.get('cvv');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'CVV is required';
      if (control.errors['pattern']) return 'Please enter a valid CVV';
    }
    return null;
  }

  get termsError(): string | null {
    const control = this.paymentForm.get('termsAccepted');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'You must accept the terms and conditions';
    }
    return null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }

  getExpiryMonths(): string[] {
    return Array.from({ length: 12 }, (_, i) => 
      (i + 1).toString().padStart(2, '0')
    );
  }

  getExpiryYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => currentYear + i);
  }
}
