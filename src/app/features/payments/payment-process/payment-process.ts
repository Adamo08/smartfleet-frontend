import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, combineLatest, of, catchError } from 'rxjs';
import { PaymentProcessingService, PaymentMethod } from '../../../core/services/payment-processing.service';
import { PaymentStateService } from '../../../core/services/payment-state.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { BookingContextService, BookingContext } from '../../../core/services/booking-context.service';
import { PaymentCalculationService, PaymentCalculationResult } from '../../../core/services/payment-calculation.service';
import { PaymentRequestDto, PaymentResponseDto, SessionRequestDto, SessionResponseDto } from '../../../core/models/payment.interface';
import {DetailedReservationDto, ReservationSummaryDto} from '../../../core/models/reservation.interface';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payment-process',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-process.html',
  styleUrl: './payment-process.css'
})
export class PaymentProcess implements OnInit, OnDestroy {
  reservationId: number | null = null;
  reservation: ReservationSummaryDto | null = null;
  loading: boolean = false;
  error: string | null = null;

  // Payment methods
  availablePaymentMethods: PaymentMethod[] = [];

  // Payment processing
  selectedPaymentMethod: string | null = null;
  isProcessingPayment: boolean = false;
  paymentError: string | null = null;

  // Enhanced payment calculation
  paymentCalculation: PaymentCalculationResult | null = null;
  bookingContext: BookingContext | null = null;
  calculationError: string | null = null;

  // Modal state
  showPaymentModal: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentProcessingService: PaymentProcessingService,
    private paymentStateService: PaymentStateService,
    private reservationService: ReservationService,
    private bookingContextService: BookingContextService,
    private paymentCalculationService: PaymentCalculationService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAvailablePaymentMethods();
    this.setupRouteParams();
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

  private loadReservationDetails(): void {
    if (!this.reservationId) return;

    this.loading = true;
    
    // Load reservation and try to restore booking context
    this.reservationService.getReservationById(this.reservationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (reservation: DetailedReservationDto) => {
        this.reservation = reservation;
        
        // Try to load booking context for this reservation
        this.loadBookingContext();
        
        // Calculate payment amount
        this.calculatePaymentAmount();
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load reservation details:', error);
        this.error = 'Failed to load reservation details';
        this.loading = false;
      }
    });
  }

  private loadBookingContext(): void {
    if (!this.reservationId) return;
    
    // Try to load from localStorage first
    const contextLoaded = this.bookingContextService.loadContextForReservation(this.reservationId);
    
    if (contextLoaded) {
      this.bookingContext = this.bookingContextService.currentContext;
      console.log('✅ Booking context loaded from storage:', this.bookingContext);
    } else if (this.reservation?.bookingContext) {
      // Fallback to reservation's booking context
      this.convertReservationContextToBookingContext();
      console.log('✅ Booking context loaded from reservation:', this.bookingContext);
    } else {
      console.log('⚠️ No booking context found, will use default calculation');
    }
  }

  private convertReservationContextToBookingContext(): void {
    if (!this.reservation?.bookingContext) return;
    
    const resContext = this.reservation.bookingContext;
    
    this.bookingContextService.initializeBookingContext(
      this.reservation.vehicle.id,
      this.reservation.vehicle.pricePerDay
    );
    
    this.bookingContextService.setBookingDates(
      new Date(this.reservation.startDate),
      new Date(this.reservation.endDate)
    );
    
    this.bookingContextService.setSlotType(resContext.slotType, resContext.duration);
    this.bookingContextService.setCalculationMethod(resContext.calculationMethod);
    
    if (resContext.selectedSlotIds) {
      this.bookingContextService.setSelectedSlots(resContext.selectedSlotIds);
    }
    
    if (resContext.originalAmount) {
      this.bookingContextService.setTotalAmount(resContext.originalAmount);
    }
    
    this.bookingContext = this.bookingContextService.currentContext;
  }

  private loadAvailablePaymentMethods(): void {
    this.paymentProcessingService.getAvailablePaymentMethods().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (methods: PaymentMethod[]) => {
        this.availablePaymentMethods = methods.filter(m => m.isActive);

        // Auto-select first available method
        if (this.availablePaymentMethods.length > 0 && !this.selectedPaymentMethod) {
          this.selectedPaymentMethod = this.availablePaymentMethods[0].id;
        }
      },
      error: (error: any) => {
        console.error('Failed to load payment methods:', error);
        // Fallback to default methods
        this.availablePaymentMethods = [
          { id: 'paypal', name: 'PayPal', description: 'Pay with your PayPal account', icon: '💳', isActive: true, provider: 'paypalPaymentProvider' },
          { id: 'onsite', name: 'On-site Payment', description: 'Pay in person at our location', icon: '🏪', isActive: true, provider: 'onSitePaymentProvider' }
        ];

        if (!this.selectedPaymentMethod) {
          this.selectedPaymentMethod = this.availablePaymentMethods[0].id;
        }
      }
    });
  }

  onPaymentMethodSelect(methodId: string): void {
    this.selectedPaymentMethod = methodId;
  }

  onSubmitPayment(): void {
    if (!this.selectedPaymentMethod) {
      this.toastr.error('Please select a payment method');
      return;
    }

    if (this.selectedPaymentMethod === 'onsite') {
      this.processOnsitePayment();
    } else if (this.selectedPaymentMethod === 'paypal') {
      this.createPaymentSession(this.selectedPaymentMethod);
    }
  }

  private processOnsitePayment(): void {
    if (!this.reservationId || !this.reservation || !this.paymentCalculation) return;

    this.isProcessingPayment = true;
    this.paymentError = null;

    // Use the calculated amount
    const amount = this.paymentCalculation.totalAmount;

    // First check if payment already exists
    this.paymentProcessingService.getPaymentStatus(this.reservationId)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((paymentResult: any) => {
          // If payment already exists and is completed, show success
          if (paymentResult.success && paymentResult.status === 'COMPLETED') {
            this.toastr.success('Payment already completed for this reservation.', 'Payment Complete');
            this.router.navigate(['/reservations']);
            return of(null);
          }
          
          // If payment exists but is pending, show message (don't process - admin must complete)
          if (paymentResult.success && paymentResult.status === 'PENDING') {
            this.toastr.info('On-site payment request already exists for this reservation. Please complete payment at the location. An administrator will confirm your payment.', 'Payment Pending');
            this.router.navigate(['/reservations']);
            return of(null);
          }
          
          // If no payment exists, create a new one (PENDING only)
          const sessionRequest: SessionRequestDto = {
            reservationId: this.reservationId!,
            amount: amount,
            currency: 'USD',
            successUrl: `${window.location.origin}/payments/success?reservationId=${this.reservationId}`,
            cancelUrl: `${window.location.origin}/payments/cancel?reservationId=${this.reservationId}`,
            providerName: 'onSitePaymentProvider'
          };

          return this.paymentProcessingService.createPaymentSession(sessionRequest);
        }),
        catchError((error: any) => {
          // If getPaymentStatus fails, it might mean no payment exists yet
          console.log('No existing payment found, creating new one:', error);
          const sessionRequest: SessionRequestDto = {
            reservationId: this.reservationId!,
            amount: amount,
            currency: 'USD',
            successUrl: `${window.location.origin}/payments/success?reservationId=${this.reservationId}`,
            cancelUrl: `${window.location.origin}/payments/cancel?reservationId=${this.reservationId}`,
            providerName: 'onSitePaymentProvider'
          };

          return this.paymentProcessingService.createPaymentSession(sessionRequest);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response !== null) {
            this.isProcessingPayment = false;
            this.toastr.success('On-site payment request created successfully. Please complete payment at the location. An administrator will confirm your payment.', 'Payment Request Created');
            this.router.navigate(['/reservations']);
          }
        },
        error: (error: any) => {
          console.error('On-site payment error:', error);
          this.paymentError = 'Failed to create on-site payment request';
          this.isProcessingPayment = false;
        }
      });
  }

  private createPaymentSession(method: string): void {
    if (!this.reservationId || !this.reservation || !this.paymentCalculation) return;

    this.isProcessingPayment = true;
    this.paymentError = null;

    const amount = this.paymentCalculation.totalAmount;
    const providerName = this.paymentProcessingService.mapMethodToProvider(method);

    const sessionRequest: SessionRequestDto = {
      reservationId: this.reservationId,
      amount: amount,
      currency: 'USD',
      successUrl: `${window.location.origin}/payments/success?reservationId=${this.reservationId}`,
      cancelUrl: `${window.location.origin}/payments/cancel?reservationId=${this.reservationId}`,
      providerName: providerName
    };

    this.paymentProcessingService.createPaymentSession(sessionRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isProcessingPayment = false;
          if (response.redirectUrl) {
            // Redirect to payment provider
            window.location.href = response.redirectUrl;
          } else {
            this.toastr.success('Payment session created successfully');
            this.router.navigate(['/reservations']);
          }
        },
        error: (error: any) => {
          console.error('Payment session creation error:', error);
          this.paymentError = 'Failed to create payment session';
          this.isProcessingPayment = false;
        }
      });
  }

  private calculatePaymentAmount(): void {
    if (!this.reservation) return;

    try {
      // Use the enhanced payment calculation service with reservation and booking context
      this.paymentCalculation = this.paymentCalculationService.calculatePaymentAmount(
        this.reservation,
        this.bookingContext || undefined
      );
      
      console.log('✅ Payment calculated using payment calculation service:', this.paymentCalculation);
      
      // Ensure breakdown exists
      if (!this.paymentCalculation.breakdown) {
        console.warn('Payment calculation missing breakdown, using fallback');
        this.fallbackCalculation();
        return;
      }
      
      // Update payment state with calculated amount
      this.paymentStateService.setReservationForPayment(
        this.reservation.id,
        this.paymentCalculation.totalAmount,
        this.paymentCalculation.currency
      );
      
    } catch (error) {
      console.error('❌ Error calculating payment amount:', error);
      this.calculationError = 'Failed to calculate payment amount';
      this.fallbackCalculation();
    }
  }

  private fallbackCalculation(): void {
    if (!this.reservation) return;
    
    const dailyRate = this.reservation.vehicle.pricePerDay;
    const duration = 24; // Default 24 hours
    const amount = this.paymentProcessingService.calculatePaymentAmountByHours(dailyRate, duration);
    
    this.paymentCalculation = {
      totalAmount: amount,
      currency: 'USD',
      calculationMethod: 'DEFAULT',
      breakdown: {
        baseAmount: amount,
        duration: duration,
        durationDays: 1,
        rate: dailyRate,
        rateType: 'DAILY',
        fees: undefined,
        discounts: undefined
      },
      metadata: {
        vehicleId: this.reservation.vehicle.id,
        pricePerDay: dailyRate,
        duration: duration,
        durationDays: 1,
        startDate: new Date(this.reservation.startDate),
        endDate: new Date(this.reservation.endDate)
      }
    };
    
    console.log('⚠️ Using fallback calculation:', this.paymentCalculation);
  }

  // Public getter for template
  calculateReservationAmount(): number {
    return this.paymentCalculation?.totalAmount || 0;
  }

  onCancel(): void {
    this.router.navigate(['/vehicles']);
  }

  get selectedMethod(): PaymentMethod | undefined {
    return this.availablePaymentMethods.find(m => m.id === this.selectedPaymentMethod);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) {
      return this.paymentCalculationService.formatCurrency(0, 'USD');
    }
    const currency = this.paymentCalculation?.currency || 'USD';
    return this.paymentCalculationService.formatCurrency(amount, currency);
  }

  // Additional template helper methods
  get hasValidCalculation(): boolean {
    return !!this.paymentCalculation && 
           !!this.paymentCalculation.breakdown && 
           !this.calculationError;
  }

  get hasBreakdown(): boolean {
    return !!this.paymentCalculation?.breakdown;
  }

  get hasFees(): boolean {
    return !!this.paymentCalculation?.breakdown?.fees;
  }

  get hasDiscounts(): boolean {
    return !!this.paymentCalculation?.breakdown?.discounts;
  }

  // Safe getters for breakdown data
  get breakdown(): any {
    return this.paymentCalculation?.breakdown || null;
  }

  get fees(): any {
    return this.paymentCalculation?.breakdown?.fees || null;
  }

  get discounts(): any {
    return this.paymentCalculation?.breakdown?.discounts || null;
  }

  get durationDays(): number {
    return this.paymentCalculation?.breakdown?.durationDays || 0;
  }

  get baseAmount(): number {
    return this.paymentCalculation?.breakdown?.baseAmount || 0;
  }

  get calculationMethodLabel(): string {
    if (!this.paymentCalculation) return 'Default';
    
    switch (this.paymentCalculation.calculationMethod) {
      case 'SLOT_BASED': return 'Slot-based';
      case 'DATE_RANGE': return 'Date range';
      case 'DURATION_BASED': return 'Duration-based';
      case 'DEFAULT': return 'Default (24h)';
      default: return 'Unknown';
    }
  }

  get durationLabel(): string {
    if (!this.paymentCalculation) return '24 hours (default)';
    
    return this.paymentCalculationService.getDurationLabel(
      this.paymentCalculation.metadata.duration
    );
  }

  get bookingContextSummary(): string {
    if (!this.bookingContext) return 'No booking context available';
    
    return this.bookingContextService.getContextSummary();
  }

  // Debug method for development
  logPaymentDetails(): void {
    console.group('🔍 Payment Process Debug Info');
    console.log('Reservation:', this.reservation);
    console.log('Booking Context:', this.bookingContext);
    console.log('Payment Calculation:', this.paymentCalculation);
    console.log('Calculation Method:', this.calculationMethodLabel);
    console.log('Duration:', this.durationLabel);
    console.groupEnd();
  }
}
