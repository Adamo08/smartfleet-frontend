import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaymentService } from './payment.service';
import { ToastrService } from 'ngx-toastr';

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  provider: string;
}

export interface PaymentSessionRequest {
  reservationId: number;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  providerName: string;
}

export interface PaymentRequest {
  reservationId: number;
  amount: number;
  currency: string;
  paymentMethodId: string;
  providerName: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentProcessingService {

  constructor(
    private paymentService: PaymentService,
    private toastr: ToastrService
  ) {}

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): Observable<PaymentMethod[]> {
    return this.paymentService.getPaymentMethods().pipe(
      map((response: any) => {
        if (response.methods && Array.isArray(response.methods)) {
          return response.methods.map((method: any) => ({
            id: method.id,
            name: method.name,
            description: method.description,
            icon: this.getPaymentMethodIcon(method.icon),
            isActive: method.active || method.isActive || false,
            provider: method.provider || method.id
          }));
        }
        return this.getDefaultPaymentMethods();
      }),
      catchError((error) => {
        console.error('Failed to load payment methods:', error);
        return of(this.getDefaultPaymentMethods());
      })
    );
  }

  /**
   * Validate payment method selection
   */
  validatePaymentMethod(methodId: string): Observable<{ isValid: boolean; message?: string }> {
    if (!methodId) {
      return throwError(() => new Error('Payment method is required'));
    }

    return this.paymentService.validatePaymentMethod(methodId).pipe(
      map((response: any) => ({
        isValid: response.isValid || false,
        message: response.message
      })),
      catchError((error) => {
        console.error('Payment method validation error:', error);
        return throwError(() => new Error('Failed to validate payment method'));
      })
    );
  }

  /**
   * Create payment session for online payments
   */
  createPaymentSession(request: PaymentSessionRequest): Observable<PaymentResult> {
    return this.paymentService.createPaymentSession(request).pipe(
      map((response: any) => ({
        success: true,
        message: 'Payment session created successfully',
        transactionId: response.sessionId,
        redirectUrl: response.redirectUrl || response.checkoutUrl
      })),
      catchError((error) => {
        console.error('Failed to create payment session:', error);
        return throwError(() => new Error(error?.error?.message || 'Failed to create payment session'));
      })
    );
  }

  /**
   * Process direct payment (onsite, etc.)
   */
  processDirectPayment(request: PaymentRequest): Observable<PaymentResult> {
    return this.paymentService.processPayment(request).pipe(
      map((response: any) => ({
        success: true,
        message: 'Payment processed successfully',
        transactionId: response.transactionId || response.id
      })),
      catchError((error) => {
        console.error('Payment processing error:', error);
        return throwError(() => new Error(error?.error?.message || 'Payment processing failed'));
      })
    );
  }

  /**
   * Confirm payment after returning from payment provider
   */
  confirmPayment(sessionId: string): Observable<PaymentResult> {
    return this.paymentService.confirmPayment(sessionId).pipe(
      map((response: any) => ({
        success: true,
        message: 'Payment confirmed successfully',
        transactionId: response.transactionId || response.id
      })),
      catchError((error) => {
        console.error('Payment confirmation error:', error);
        return throwError(() => new Error(error?.error?.message || 'Payment confirmation failed'));
      })
    );
  }

  /**
   * Get payment status for a reservation
   */
  getPaymentStatus(reservationId: number): Observable<PaymentResult> {
    return this.paymentService.getPaymentByReservationId(reservationId).pipe(
      map((payment: any) => ({
        success: true,
        message: `Payment status: ${payment.status}`,
        transactionId: payment.transactionId,
        error: payment.status === 'FAILED' ? 'Payment failed' : undefined
      })),
      catchError((error) => {
        console.error('Failed to get payment status:', error);
        return throwError(() => new Error('Failed to retrieve payment status'));
      })
    );
  }

  /**
   * Check if a payment exists for a reservation
   */
  checkPaymentExists(reservationId: number): Observable<{ exists: boolean; payment?: any }> {
    return this.paymentService.checkPaymentExists(reservationId);
  }

  /**
   * Process an existing payment for a reservation
   */
  processExistingPayment(reservationId: number): Observable<PaymentResult> {
    return this.paymentService.processExistingPayment(reservationId).pipe(
      map((response: any) => ({
        success: true,
        message: 'Existing payment processed successfully',
        transactionId: response.transactionId || response.id
      })),
      catchError((error) => {
        console.error('Existing payment processing error:', error);
        return throwError(() => new Error(error?.error?.message || 'Failed to process existing payment'));
      })
    );
  }

  /**
   * Calculate total payment amount based on duration and daily rate
   */
  calculatePaymentAmount(dailyRate: number, startDate: Date, endDate: Date): number {
    if (!dailyRate || !startDate || !endDate) return 0;
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays * dailyRate;
  }

  /**
   * Calculate total payment amount based on duration in hours
   */
  calculatePaymentAmountByHours(dailyRate: number, durationHours: number): number {
    if (!dailyRate || !durationHours) return 0;
    
    return dailyRate * Math.ceil(durationHours / 24);
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get duration label (hours, days, weeks)
   */
  getDurationLabel(durationHours: number): string {
    if (durationHours < 24) {
      return `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
    } else if (durationHours < 168) { // 7 days
      return `${Math.round(durationHours / 24)} day${Math.round(durationHours / 24) > 1 ? 's' : ''}`;
    } else {
      return `${Math.round(durationHours / 168)} week${Math.round(durationHours / 168) > 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if payment method is available
   */
  isPaymentMethodAvailable(methodId: string, availableMethods: PaymentMethod[]): boolean {
    const method = availableMethods.find(m => m.id === methodId);
    return method ? method.isActive : false;
  }

  /**
   * Map payment method to provider name
   */
  mapMethodToProvider(methodId: string): string {
    switch (methodId) {
      case 'paypal':
        return 'paypalPaymentProvider';
      case 'onsite':
        return 'onSitePaymentProvider';
      default:
        return 'onSitePaymentProvider';
    }
  }

  /**
   * Handle payment errors consistently
   */
  handlePaymentError(error: any, context: string = 'Payment'): void {
    const errorMessage = error?.error?.message || error?.message || `${context} failed`;
    this.toastr.error(errorMessage, 'Error');
    console.error(`${context} error:`, error);
  }

  /**
   * Show payment success message
   */
  showPaymentSuccess(message: string): void {
    this.toastr.success(message, 'Success');
  }

  /**
   * Show payment info message
   */
  showPaymentInfo(message: string): void {
    this.toastr.info(message, 'Info');
  }

  private getPaymentMethodIcon(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'paypal': '💳',
      'credit-card': '🏦',
      'store': '🏪',
      'default': '💳'
    };
    return iconMap[iconName] || iconMap['default'];
  }

  private getDefaultPaymentMethods(): PaymentMethod[] {
    return [
      { 
        id: 'paypal', 
        name: 'PayPal', 
        description: 'Pay with your PayPal account', 
        icon: '💳', 
        isActive: true,
        provider: 'paypalPaymentProvider'
      },
      { 
        id: 'onsite', 
        name: 'On-site Payment', 
        description: 'Pay in person at our location', 
        icon: '🏪', 
        isActive: true,
        provider: 'onSitePaymentProvider'
      }
    ];
  }
}

