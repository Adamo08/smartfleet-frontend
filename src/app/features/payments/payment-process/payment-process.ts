import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { PaymentRequestDto, PaymentResponseDto, SessionRequestDto, SessionResponseDto } from '../../../core/models/payment.interface';
import { ReservationSummaryDto } from '../../../core/models/reservation.interface';

import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payment-process',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './payment-process.html',
  styleUrl: './payment-process.css'
})
export class PaymentProcess implements OnInit, OnDestroy {
  reservationId: number | null = null;
  reservation: ReservationSummaryDto | null = null;
  loading: boolean = false;
  error: string | null = null;

  // Payment form
  paymentForm: FormGroup;

  // Payment methods
  availablePaymentMethods: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    isActive: boolean;
  }> = [];

  // Payment processing
  selectedPaymentMethod: string | null = null;
  isProcessingPayment: boolean = false;
  paymentError: string | null = null;

  // Modal state
  showPaymentModal: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private reservationService: ReservationService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['', [Validators.required]],
      cardNumber: [''],
      cardholderName: [''],
      expiryMonth: [''],
      expiryYear: [''],
      cvv: [''],
      billingAddress: [''],
      city: [''],
      postalCode: [''],
      country: [''],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    this.loadAvailablePaymentMethods();
    this.setupRouteParams();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteParams(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.reservationId = params['reservationId'] ? +params['reservationId'] : null;
      if (this.reservationId) {
        this.loadReservationDetails();
      } else {
        this.error = 'No reservation ID provided';
      }
    });
  }

  private setupFormListeners(): void {
    this.paymentForm.get('paymentMethod')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(method => {
      this.selectedPaymentMethod = method;
      this.updateValidationRules(method);
    });
  }

  private loadReservationDetails(): void {
    if (!this.reservationId) return;

    this.loading = true;
    this.reservationService.getReservationById(this.reservationId).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservation:', error);
        this.error = 'Failed to load reservation details';
        this.loading = false;
      }
    });
  }

  private loadAvailablePaymentMethods(): void {
    this.paymentService.getPaymentMethods().subscribe({
      next: (response) => {
        this.availablePaymentMethods = response.methods;
        // Set default payment method
        if (this.availablePaymentMethods.length > 0) {
          const defaultMethod = this.availablePaymentMethods.find(m => m.isActive);
          if (defaultMethod) {
            this.paymentForm.patchValue({ paymentMethod: defaultMethod.id });
            this.selectedPaymentMethod = defaultMethod.id;
          }
        }
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
        this.error = 'Failed to load payment methods';
      }
    });
  }

  private updateValidationRules(method: string): void {
    const cardControls = ['cardNumber', 'cardholderName', 'expiryMonth', 'expiryYear', 'cvv'];
    const addressControls = ['billingAddress', 'city', 'postalCode', 'country'];

    if (method === 'cmi') {
      // CMI requires card details
      cardControls.forEach(controlName => {
        const control = this.paymentForm.get(controlName);
        if (control) {
          control.setValidators([Validators.required]);
          control.updateValueAndValidity();
        }
      });

      // Address is optional for CMI
      addressControls.forEach(controlName => {
        const control = this.paymentForm.get(controlName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });
    } else if (method === 'paypal') {
      // PayPal doesn't require card details
      cardControls.forEach(controlName => {
        const control = this.paymentForm.get(controlName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });

      // Address is optional for PayPal
      addressControls.forEach(controlName => {
        const control = this.paymentForm.get(controlName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });
    } else if (method === 'onsite') {
      // On-site payment doesn't require any card details
      [...cardControls, ...addressControls].forEach(controlName => {
        const control = this.paymentForm.get(controlName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });
    }
  }

  onPaymentMethodSelect(methodId: string): void {
    this.paymentForm.patchValue({ paymentMethod: methodId });
    this.selectedPaymentMethod = methodId;
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || this.isProcessingPayment) {
      return;
    }

    this.isProcessingPayment = true;
    this.paymentError = null;

    const formValue = this.paymentForm.value;
    const method = formValue.paymentMethod;

    if (method === 'onsite') {
      this.processOnsitePayment();
    } else if (method === 'paypal' || method === 'cmi') {
      this.createPaymentSession(method);
    } else {
      this.processDirectPayment();
    }
  }

  private processOnsitePayment(): void {
    if (!this.reservationId || !this.reservation) return;

    // Calculate amount based on duration and vehicle price
    const amount = this.calculateReservationAmount();

    const paymentRequest: PaymentRequestDto = {
      reservationId: this.reservationId,
      amount: amount,
      currency: 'USD',
      paymentMethodId: 'onsite',
      providerName: 'onSitePaymentProvider'
    };

    this.paymentService.processPayment(paymentRequest).subscribe({
      next: (response) => {
        this.isProcessingPayment = false;
        this.toastr.success('On-site payment request submitted successfully');
        this.router.navigate(['/reservations']);
      },
      error: (error) => {
        console.error('On-site payment error:', error);
        this.paymentError = 'Failed to submit on-site payment request';
        this.isProcessingPayment = false;
      }
    });
  }

  private createPaymentSession(method: string): void {
    if (!this.reservationId || !this.reservation) return;

    // Calculate amount based on duration and vehicle price
    const amount = this.calculateReservationAmount();

    const sessionRequest: SessionRequestDto = {
      reservationId: this.reservationId,
      amount: amount,
      currency: 'USD',
      successUrl: `${window.location.origin}/payments/success`,
      cancelUrl: `${window.location.origin}/payments/cancel`,
      providerName: this.mapMethodToProvider(method)
    };

    console.log('=== CREATING PAYMENT SESSION ===');
    console.log('Session request:', sessionRequest);
    console.log('Method:', method);

    this.paymentService.createPaymentSession(sessionRequest).subscribe({
      next: (response) => {
        console.log('Payment session created successfully:', response);
        this.isProcessingPayment = false;
        if (response.redirectUrl) {
          console.log('Redirecting to PayPal:', response.redirectUrl);
          window.location.href = response.redirectUrl;
        } else {
          console.error('No redirect URL received from payment provider');
          this.paymentError = 'No redirect URL received from payment provider';
        }
      },
      error: (error) => {
        console.error('Payment session error:', error);
        this.paymentError = 'Failed to create payment session';
        this.isProcessingPayment = false;
      }
    });
  }

  private processDirectPayment(): void {
    if (!this.reservationId || !this.reservation) return;

    const formValue = this.paymentForm.value;
    // Calculate amount based on duration and vehicle price
    const amount = this.calculateReservationAmount();

    const paymentRequest: PaymentRequestDto = {
      reservationId: this.reservationId,
      amount: amount,
      currency: 'USD',
      paymentMethodId: formValue.paymentMethod,
      providerName: this.mapMethodToProvider(formValue.paymentMethod)
    };

    this.paymentService.processPayment(paymentRequest).subscribe({
      next: (response) => {
        this.isProcessingPayment = false;
        this.toastr.success('Payment processed successfully');
        this.router.navigate(['/reservations']);
      },
      error: (error) => {
        console.error('Direct payment error:', error);
        this.paymentError = 'Payment failed. Please try again.';
        this.isProcessingPayment = false;
      }
    });
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

  public calculateReservationAmount(): number {
    if (!this.reservation || !this.reservation.vehicle) return 0;

    const startDate = new Date(this.reservation.startDate);
    const endDate = new Date(this.reservation.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Use the actual vehicle price per day from the backend
    const dailyRate = this.reservation.vehicle.pricePerDay || 0;

    return diffDays * dailyRate;
  }

  public getTotalDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onCancel(): void {
    this.router.navigate(['/reservations']);
  }

  get isFormValid(): boolean {
    return this.paymentForm.valid && !this.isProcessingPayment;
  }

  get selectedMethod(): any {
    return this.availablePaymentMethods.find(m => m.id === this.selectedPaymentMethod);
  }

  get requiresCardDetails(): boolean {
    return this.selectedPaymentMethod === 'cmi';
  }

  get requiresAddress(): boolean {
    return this.selectedPaymentMethod === 'cmi';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  // Card input handling methods
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

  // Error getter methods
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
}
