import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.css'
})
export class PaymentMethods implements OnInit, OnDestroy {
  paymentMethods: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  showAddForm: boolean = false;
  
  addMethodForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {
    this.addMethodForm = this.fb.group({
      methodType: ['paypal', [Validators.required]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
      cardholderName: ['', [Validators.required, Validators.minLength(3)]],
      expiryMonth: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]],
      expiryYear: ['', [Validators.required, Validators.pattern(/^(20[2-9][0-9]|20[3-9][0-9])$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      isDefault: [false],
      saveMethod: [true]
    });
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPaymentMethods(): void {
    this.loading = true;
    this.paymentService.getPaymentMethods().subscribe({
      next: (response: any) => {
        // Convert the backend response to our frontend format
        this.paymentMethods = response.methods.map((method: any) => ({
          id: method.id,
          type: method.id,
          last4: '',
          brand: method.name,
          cardholderName: '',
          expiryMonth: '',
          expiryYear: '',
          isDefault: false,
          isExpired: false
        }));
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading payment methods:', error);
        this.error = 'Failed to load payment methods';
        this.loading = false;
      }
    });
  }

  onAddMethod(): void {
    this.showAddForm = true;
  }

  onCancelAdd(): void {
    this.showAddForm = false;
    this.addMethodForm.reset({
      methodType: 'paypal',
      isDefault: false,
      saveMethod: true
    });
  }

  onSubmitAddMethod(): void {
    if (this.addMethodForm.valid) {
      const formValue = this.addMethodForm.value;
      
      // Create new payment method object
      const newMethod = {
        id: Date.now(), // Mock ID
        type: formValue.methodType,
        last4: formValue.cardNumber.slice(-4),
        brand: this.getCardBrand(formValue.cardNumber),
        cardholderName: formValue.cardholderName,
        expiryMonth: formValue.expiryMonth,
        expiryYear: formValue.expiryYear,
        isDefault: formValue.isDefault,
        isExpired: false
      };

      // Add to list
      this.paymentMethods.push(newMethod);

      // Set as default if requested
      if (formValue.isDefault) {
        this.setDefaultMethod(newMethod.id);
      }

      // Reset form and hide
      this.onCancelAdd();
    }
  }

  onSetDefault(methodId: number): void {
    this.setDefaultMethod(methodId);
  }

  onDeleteMethod(methodId: number): void {
    if (confirm('Are you sure you want to delete this payment method?')) {
      this.paymentMethods = this.paymentMethods.filter(m => m.id !== methodId);
      
      // If we deleted the default method, set the first remaining as default
      if (this.paymentMethods.length > 0 && !this.paymentMethods.some(m => m.isDefault)) {
        this.paymentMethods[0].isDefault = true;
      }
    }
  }

  private setDefaultMethod(methodId: number): void {
    this.paymentMethods.forEach(method => {
      method.isDefault = method.id === methodId;
    });
  }

  private getCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (cleanNumber.startsWith('5')) return 'Mastercard';
    if (cleanNumber.startsWith('3')) return 'American Express';
    if (cleanNumber.startsWith('6')) return 'Discover';
    return 'Unknown';
  }

  getExpiryMonths(): string[] {
    return Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  }

  getExpiryYears(): string[] {
    const currentYear = new Date().getFullYear();
    return Array.from({length: 10}, (_, i) => String(currentYear + i));
  }

  getCardIcon(brand: string): string {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '🔵';
      case 'american express': return '💳';
      case 'discover': return '🔴';
      default: return '💳';
    }
  }

  getMethodTypeIcon(type: string): string {
    switch (type) {
      case 'paypal': return '🔵';
      case 'cmi': return '💳';
      case 'onsite': return '🏢';
      default: return '💳';
    }
  }

  isFormValid(): boolean {
    return this.addMethodForm.valid;
  }

  get cardNumberError(): string | null {
    const control = this.addMethodForm.get('cardNumber');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Card number is required';
      if (control.errors['pattern']) return 'Please enter a valid card number';
    }
    return null;
  }

  get cardholderNameError(): string | null {
    const control = this.addMethodForm.get('cardholderName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Cardholder name is required';
      if (control.errors['minlength']) return 'Cardholder name must be at least 3 characters';
    }
    return null;
  }

  get expiryMonthError(): string | null {
    const control = this.addMethodForm.get('expiryMonth');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Expiry month is required';
      if (control.errors['pattern']) return 'Please select a valid month';
    }
    return null;
  }

  get expiryYearError(): string | null {
    const control = this.addMethodForm.get('expiryYear');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Expiry year is required';
      if (control.errors['pattern']) return 'Please select a valid year';
    }
    return null;
  }

  get cvvError(): string | null {
    const control = this.addMethodForm.get('cvv');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'CVV is required';
      if (control.errors['pattern']) return 'Please enter a valid CVV';
    }
    return null;
  }
}
