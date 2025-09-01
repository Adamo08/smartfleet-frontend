import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Observable } from 'rxjs';
import { VehicleService } from '../../../core/services/vehicle';
import { FavoriteService, Favorite } from '../../../core/services/favorite';
import { TestimonialService, Testimonial } from '../../../core/services/testimonial';
import { AuthService } from '../../../core/services/auth';
import { ReservationService } from '../../../core/services/reservation.service';
import { PaymentProcessingService, PaymentMethod } from '../../../core/services/payment-processing.service';
import { PaymentStateService } from '../../../core/services/payment-state.service';
import { BookmarkService } from '../../../core/services/bookmark.service';
import { ToastrService } from 'ngx-toastr';
import { Vehicle } from '../../../core/models/vehicle.interface';
import { Page, Pageable } from '../../../core/models/pagination.interface';
import { VehicleFilter } from '../../../core/models/vehicle-filter.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';
import { CreateReservationRequest, ReservationBookingContext } from '../../../core/models/reservation.interface';
import { BookingContextService } from '../../../core/services/booking-context.service';
import { PaymentCalculationService } from '../../../core/services/payment-calculation.service';
import { Modal } from '../../../shared/components/modal/modal';
import { SlotSelector } from '../../reservations/slot-selector/slot-selector';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, Modal, SlotSelector],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.css'
})
export class VehicleDetail implements OnInit, OnDestroy {
  @Input() vehicle: Vehicle | null = null;
  vehicleTestimonials: Testimonial[] = [];
  similarVehicles: Vehicle[] = [];
  favorites: Favorite[] = [];
  loading = true;
  isLoggedIn = false;
  isFavorite = false;
  isBookingOpen = false;
  isSubmitting = false;

  // Testimonial form properties
  testimonialForm!: FormGroup;
  testimonialRating = 0;
  isSubmittingTestimonial = false;
  hasSubmittedTestimonial = false;
  
  // Forum-style testimonials properties
  hasMoreTestimonials = false;
  loadingMoreTestimonials = false;
  testimonialPage = 0;
  testimonialPageSize = 5;

  // New properties for availability check and booking
  hasAvailableSlotsInDateRange: boolean = false;
  selectedAvailabilityStartDate: Date | null = null;
  selectedAvailabilityEndDate: Date | null = null;
  selectedSlotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM' = 'DAILY';
  selectedDuration: number = 24; // in hours
  bookNowEnabled: boolean = false; // Controls 'Book Now' button

  // Multi-step booking flow
  currentBookingStep: 'type' | 'dates' | 'confirmation' | 'payment' = 'type';

  // Expose Math for template use
  readonly Math = Math;

  // Payment related properties
  selectedPaymentMethod: string | null = null;
  isProcessingPayment = false;
  paymentError: string | null = null;
  currentReservationId: number | null = null; // Store the created reservation ID

  // Payment method mapping
  readonly paymentMethods = {
    paypal: { id: 'paypal', name: 'PayPal', provider: 'paypal' },

    onsite: { id: 'onsite', name: 'On-Site', provider: 'onsite' }
  };

  // Check available payment methods
  availablePaymentMethods: PaymentMethod[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private vehicleService: VehicleService,
    private favoriteService: FavoriteService,
    private testimonialService: TestimonialService,
    private authService: AuthService,
    private toastr: ToastrService,
    private reservationService: ReservationService,
    private paymentProcessingService: PaymentProcessingService,
    private paymentStateService: PaymentStateService,
    private bookingContextService: BookingContextService,
    private paymentCalculationService: PaymentCalculationService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeTestimonialForm();
    
    // If vehicle is passed as an input, we don't need to load it from route params
    if (!this.vehicle) {
      this.loadVehicleFromRoute();
    } else {
      // If vehicle is passed as input, proceed with related data loading
      this.loadVehicleTestimonials(this.vehicle.id);
      this.loadSimilarVehicles(this.vehicle);
      this.checkIfUserHasSubmittedTestimonial(this.vehicle.id);
      this.loading = false;
    }

    this.isLoggedIn = this.authService.isAuthenticated();
    this.updateBookNowButtonState(); // Initial state update
    if (this.isLoggedIn) {
      this.loadFavorites();
      this.loadAvailablePaymentMethods();
    }

    // Check for payment return parameters
    this.checkPaymentReturnParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load available payment methods from backend
  loadAvailablePaymentMethods(): void {
    this.paymentProcessingService.getAvailablePaymentMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (methods: PaymentMethod[]) => {
          this.availablePaymentMethods = methods;
        },
        error: (err: any) => {
          console.error('Failed to load payment methods:', err);
          // Fallback to default payment methods if backend fails
          this.availablePaymentMethods = [
            { id: 'paypal', name: 'PayPal', description: 'Pay with your PayPal account', icon: '💳', isActive: true, provider: 'paypalPaymentProvider' },

            { id: 'onsite', name: 'On-site Payment', description: 'Pay in person at our location', icon: '🏪', isActive: true, provider: 'onSitePaymentProvider' }
          ];
        }
      });
  }



  // Check for payment return parameters in URL
  private checkPaymentReturnParams(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const paymentStatus = urlParams.get('payment');

    if (sessionId) {
      // User returned from payment provider, confirm payment
      this.handlePaymentConfirmation(sessionId);
    } else if (paymentStatus === 'cancelled') {
      // User cancelled payment
      this.toastr.info('Payment was cancelled. Your reservation is saved for later completion.', 'Payment Cancelled');
    }
  }

  private loadVehicleFromRoute(): void {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.vehicleService.getVehicleById(parseInt(vehicleId)).subscribe({
        next: (vehicle: Vehicle) => { // Explicitly type 'vehicle'
          this.vehicle = vehicle;
          this.loadVehicleTestimonials(vehicle.id);
          this.loadSimilarVehicles(vehicle);
          this.checkIfUserHasSubmittedTestimonial(vehicle.id);
          this.loading = false;
        },
        error: (error: any) => { // Explicitly type 'error'
          console.error('Error loading vehicle:', error);
          this.loading = false;
        }
      });
    }
  }

  private loadFavorites(): void {
    this.favoriteService.getMyFavorites().subscribe({
      next: (favorites: Favorite[]) => { // Explicitly type 'favorites'
        this.favorites = favorites;
        this.updateFavoriteStatus();
      },
      error: (error: any) => { // Explicitly type 'error'
        console.error('Error loading favorites:', error);
      }
    });
  }

  private loadVehicleTestimonials(vehicleId: number): void {
    this.testimonialService.getPublicTestimonials({ vehicleId, page: 0, size: 6 }).subscribe({
      next: (testimonials: Testimonial[]) => { // Explicitly type 'testimonials'
        this.vehicleTestimonials = testimonials;
      },
      error: (error: any) => { // Explicitly type 'error'
        console.error('Error loading vehicle testimonials:', error);
        // Load some mock testimonials for demonstration
        this.loadMockVehicleTestimonials();
      }
    });
  }

  private loadMockVehicleTestimonials(): void {
    if (this.vehicle) {
      this.vehicleTestimonials = [
        {
          id: 1,
          userId: 1,
          vehicleId: this.vehicle.id,
          title: "Excellent Vehicle Experience",
          content: "This {{ vehicle.brand }} {{ vehicle.model }} exceeded my expectations. Smooth ride, great fuel efficiency, and perfect for my business trips. Highly recommend!",
          rating: 5,
          approved: true,
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          userName: "John Smith",
          vehicleBrand: this.vehicle.brand,
          vehicleModel: this.vehicle.model
        },
        {
          id: 2,
          userId: 2,
          vehicleId: this.vehicle.id,
          title: "Great Performance",
          content: "Rented this {{ vehicle.brand }} {{ vehicle.model }} for a weekend trip. Comfortable, reliable, and the perfect size for our family. Will definitely rent again!",
          rating: 4,
          approved: true,
          createdAt: "2024-01-10T14:30:00Z",
          updatedAt: "2024-01-10T14:30:00Z",
          userName: "Maria Garcia",
          vehicleBrand: this.vehicle.brand,
          vehicleModel: this.vehicle.model
        }
      ];
      
      // Set that more testimonials are available for the "Load More" functionality
      this.hasMoreTestimonials = true;
    }
  }

  private loadSimilarVehicles(currentVehicle: Vehicle): void {
    const pageable: Pageable = {
      page: 0,
      size: 4,
      sortBy: 'pricePerDay',
      sortDirection: 'ASC'
    };

    const filters: VehicleFilter = {
      categoryId: currentVehicle.categoryId || undefined,
      minPrice: currentVehicle.pricePerDay ? currentVehicle.pricePerDay * 0.7 : undefined,
      maxPrice: currentVehicle.pricePerDay ? currentVehicle.pricePerDay * 1.3 : undefined,
    };

    this.vehicleService.getVehicles(pageable, filters).subscribe({
      next: (page: Page<Vehicle>) => { // Explicitly type 'page'
        this.similarVehicles = page.content.filter((v: Vehicle) => v.id !== currentVehicle.id).slice(0, 3); // Explicitly type 'v'
      },
      error: (error: any) => { // Explicitly type 'error'
        console.error('Error loading similar vehicles:', error);
      }
    });
  }

  private updateFavoriteStatus(): void {
    if (this.vehicle) {
      this.isFavorite = this.favorites.some(favorite => favorite.vehicleId === this.vehicle!.id);
    }
  }

  toggleFavorite(): void {
    if (!this.vehicle) return;

    const vehicleName = `${this.vehicle.brand} ${this.vehicle.model}`;

    if (this.isFavorite) {
      // Remove from favorites
      const favorite = this.favorites.find(f => f.vehicleId === this.vehicle!.id);
      if (favorite) {
        this.favoriteService.deleteFavorite(favorite.id).subscribe({
          next: () => {
            this.favorites = this.favorites.filter(f => f.vehicleId !== this.vehicle!.id);
            this.isFavorite = false;
            this.toastr.success(`${vehicleName} removed from favorites`, 'Favorite Removed');
          },
          error: (error: any) => { // Explicitly type 'error'
            console.error('Error removing from favorites:', error);
            this.toastr.error('Failed to remove from favorites', 'Error');
          }
        });
      }
    } else {
      // Add to favorites
      this.favoriteService.addToFavorites(this.vehicle.id).subscribe({
        next: (favorite: Favorite) => { // Explicitly type 'favorite'
          this.favorites.push(favorite);
          this.isFavorite = true;
          this.toastr.success(`${vehicleName} added to favorites`, 'Favorite Added');
        },
        error: (error: any) => { // Explicitly type 'error'
          console.error('Error adding to favorites:', error);
          this.toastr.error('Failed to add to favorites', 'Error');
        }
      });
    }
  }

  bookVehicle(): void {
    // This method will now primarily open the booking modal
    if (!this.vehicle || !this.bookNowEnabled) return;
    this.isBookingOpen = true;
    this.currentBookingStep = 'type'; // Start with booking type selection
  }

  // Multi-step booking flow methods
  nextBookingStep(): void {
    switch (this.currentBookingStep) {
      case 'type':
        this.currentBookingStep = 'dates';
        break;
      case 'dates':
        this.currentBookingStep = 'confirmation';
        break;
      case 'confirmation':
        this.currentBookingStep = 'payment';
        break;
    }
  }

  previousBookingStep(): void {
    switch (this.currentBookingStep) {
      case 'dates':
        this.currentBookingStep = 'type';
        break;
      case 'confirmation':
        this.currentBookingStep = 'dates';
        break;
      case 'payment':
        this.currentBookingStep = 'confirmation';
        break;
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentBookingStep) {
      case 'type':
        return this.selectedSlotType !== undefined;
      case 'dates':
        return this.selectedAvailabilityStartDate !== null &&
               this.selectedAvailabilityEndDate !== null &&
               this.hasAvailableSlotsInDateRange;
      case 'confirmation':
        return true;
      case 'payment':
        return true; // Payment step is the final step
      default:
        return false;
    }
  }

  getStepTitle(): string {
    switch (this.currentBookingStep) {
      case 'type':
        return 'Select Booking Type';
      case 'dates':
        return 'Choose Dates & Duration';
      case 'confirmation':
        return 'Confirm & Book';
      case 'payment':
        return 'Complete Payment';
      default:
        return 'Book Vehicle';
    }
  }

  getStepDescription(): string {
    switch (this.currentBookingStep) {
      case 'type':
        return 'Choose how you want to rent this vehicle';
      case 'dates':
        return 'Select your preferred dates and duration';
      case 'confirmation':
        return 'Review your booking details and confirm';
      case 'payment':
        return 'Complete the payment process to finalize your reservation.';
      default:
        return '';
    }
  }


  onDateRangeSelected(event: {
    startDate: Date,
    endDate: Date,
    hasSlots: boolean,
    slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM',
    duration: number
  }): void {
    this.selectedAvailabilityStartDate = event.startDate;
    this.selectedAvailabilityEndDate = event.endDate;
    this.selectedSlotType = event.slotType;
    this.selectedDuration = event.duration;
    this.hasAvailableSlotsInDateRange = event.hasSlots;
    this.updateBookNowButtonState();
  }

  private updateBookNowButtonState(): void {
    // Book Now button is enabled for authenticated users
    // The actual availability check happens when they click Book Now
    this.bookNowEnabled = this.isLoggedIn;
  }

  closeBooking(): void {
    this.isBookingOpen = false;
    this.currentReservationId = null;
    this.selectedPaymentMethod = null;
    this.paymentError = null;
    this.isProcessingPayment = false;
    // Reset to first step for next booking
    this.currentBookingStep = 'type';
  }

  confirmBooking(): void {
    // When confirming booking, we use the selected date range from SlotSelector,
    // not necessarily a pre-selected 'SlotDto' from a list of granular slots.
    if (!this.vehicle || !this.selectedAvailabilityStartDate || !this.selectedAvailabilityEndDate || this.isSubmitting) {
      this.toastr.error('Please select valid start and end dates for your reservation.', 'Missing Information');
      return;
    }
    this.isSubmitting = true;

    // Create booking context to preserve booking details
    const bookingContext: ReservationBookingContext = {
      slotType: this.selectedSlotType,
      duration: this.selectedDuration,
      calculationMethod: 'DATE_RANGE', // Using date range for calculation
      originalAmount: this.getTotalPaymentAmount(),
      preferences: {
        preferredPaymentMethod: this.selectedPaymentMethod || undefined
      }
    };

    const request: CreateReservationRequest = {
      vehicleId: this.vehicle.id,
      startDate: this.selectedAvailabilityStartDate,
      endDate: this.selectedAvailabilityEndDate,
      comment: `Booking type: ${this.selectedSlotType}, Duration: ${this.selectedDuration} hours`,
      bookingContext: bookingContext
    };

    this.reservationService.createReservation(request).subscribe({
      next: (reservation: any) => { // Explicitly type 'reservation'
        this.currentReservationId = reservation.id; // Store the reservation ID
        
        // Save booking context for later retrieval
        this.saveBookingContextForReservation(reservation.id);
        
        this.toastr.success('Reservation created successfully! Proceeding to payment...', 'Reservation Created');
        this.isSubmitting = false;
        // Move to payment step instead of closing
        this.currentBookingStep = 'payment';
      },
      error: (err: any) => { // Explicitly type 'err'
        console.error('Failed to create reservation', err);
        this.toastr.error(err?.error?.message || 'Failed to create reservation', 'Error');
        this.isSubmitting = false;
      }
    });
  }

  private saveBookingContextForReservation(reservationId: number): void {
    if (!this.vehicle) return;
    
    // Initialize booking context service with current booking details
    const bookingContext = this.bookingContextService;
    bookingContext.initializeBookingContext(this.vehicle.id, this.vehicle.pricePerDay);
    bookingContext.setBookingDates(this.selectedAvailabilityStartDate!, this.selectedAvailabilityEndDate!);
    bookingContext.setSlotType(this.selectedSlotType, this.selectedDuration);
    bookingContext.setCalculationMethod('DATE_RANGE');
    bookingContext.setTotalAmount(this.getTotalPaymentAmount());
    
    if (this.selectedPaymentMethod) {
      bookingContext.setComment(`Preferred payment: ${this.selectedPaymentMethod}`);
    }
    
    // Save to localStorage for retrieval during payment
    bookingContext.saveContextForReservation(reservationId);
    
    console.log('✅ Booking context saved for reservation:', reservationId, bookingContext.currentContext);
  }

  startPayment(provider: string): void {
    if (!this.currentReservationId) {
      this.toastr.error('No reservation ID available for payment.', 'Payment Error');
      return;
    }

    // Calculate the total amount based on duration and vehicle price
    const totalAmount = this.vehicle ? this.vehicle.pricePerDay * Math.ceil(this.selectedDuration / 24) : 0;

    if (provider === 'onsite') {
      // For onsite payments, we just mark it as pending
      this.toastr.success('On-site payment request created. Please complete payment at the location to confirm your reservation.', 'Payment Request Created');
      return;
    }

    // For online payments (PayPal), create a payment session
    const sessionRequest = {
      amount: totalAmount,
      currency: 'USD',
      reservationId: this.currentReservationId,
      successUrl: window.location.origin + '/reservations',
      cancelUrl: window.location.origin + '/vehicles/' + this.vehicle?.id,
      providerName: `${this.selectedPaymentMethod}PaymentProvider` || 'paypalPaymentProvider'
    };

    this.paymentProcessingService.createPaymentSession(sessionRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Payment session created! Redirecting to payment...', 'Payment Session Created');
          // Redirect to the payment provider
          if (response.redirectUrl) {
            window.location.href = response.redirectUrl;
          }
        },
        error: (err: any) => {
          console.error('Failed to create payment session', err);
          this.toastr.error(err?.error?.message || 'Failed to create payment session', 'Error');
        }
      });
  }

  // New payment methods
  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    this.paymentError = null; // Clear any previous errors

    // Validate the selected payment method
    if (method !== 'onsite') {
      this.paymentProcessingService.validatePaymentMethod(method)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (!response.isValid) {
              this.paymentError = response.message || 'Payment method validation failed';
            }
          },
          error: (err: any) => {
            console.error('Payment method validation error:', err);
            this.paymentError = 'Failed to validate payment method';
          }
        });
    }
  }

  // Validate payment method selection
  validatePaymentMethodSelection(): boolean {
    if (!this.selectedPaymentMethod) {
      this.paymentError = 'Please select a payment method';
      return false;
    }

    if (!this.isPaymentMethodAvailable(this.selectedPaymentMethod)) {
      this.paymentError = 'Selected payment method is not available';
      return false;
    }

    return true;
  }

  // Enhanced payment processing with validation
  processPayment(): void {
    if (!this.validatePaymentMethodSelection()) {
      return;
    }

    if (!this.currentReservationId) {
      this.paymentError = 'No reservation available for payment';
      return;
    }

    this.isProcessingPayment = true;
    this.paymentError = null;

    if (this.selectedPaymentMethod === 'onsite') {
      // For onsite payments, we need to handle the case where a payment might already exist
      this.handleOnsitePayment();
    } else {
      // For online payments, create a payment session
      if (this.selectedPaymentMethod) {
        this.createPaymentSession(this.selectedPaymentMethod);
      } else {
        this.paymentError = 'Invalid payment method selected';
        this.isProcessingPayment = false;
      }
    }
  }

  // Handle onsite payment with duplicate prevention
  private handleOnsitePayment(): void {
    const amount = this.formatAmountForApi(this.getTotalPaymentAmount());
    
    // First, check if a payment already exists for this reservation
    this.paymentProcessingService.getPaymentStatus(this.currentReservationId!)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((paymentResult: any) => {
          // If payment already exists and is completed, show success
          if (paymentResult.success && paymentResult.status === 'COMPLETED') {
            this.toastr.success('Payment already completed for this reservation.', 'Payment Complete');
            this.closeBooking();
            return of({ skipProcessing: true });
          }
          
          // If payment exists but is pending, show message (don't process - admin must complete)
          if (paymentResult.success && paymentResult.status === 'PENDING') {
            this.toastr.info('On-site payment request already created for this reservation. Please complete payment at the location. An administrator will confirm your payment.', 'Payment Pending');
            this.closeBooking();
            return of({ skipProcessing: true });
          }
          
          // If no payment exists, create a new one
          return this.createNewOnsitePayment(amount);
        }),
        catchError((error: any) => {
          // If getPaymentStatus fails, it means no payment exists yet - proceed with creating one
          console.log('No existing payment found, creating new one:', error);
          return this.createNewOnsitePayment(amount);
        })
      )
      .subscribe({
        next: (response: any) => {
          this.isProcessingPayment = false;
          // Only show success toast if we actually created a payment (not skipped processing)
          if (response && !response.skipProcessing) {
            this.toastr.success('On-site payment request created. Please complete payment at the location to confirm your reservation.', 'Payment Request Created');
            this.closeBooking();
          }
        },
        error: (err: any) => {
          this.isProcessingPayment = false;
          this.paymentError = err?.error?.message || 'Failed to create payment request';
          this.toastr.error(this.paymentError || 'Failed to create payment request', 'Payment Error');
          console.error('Payment error:', err);
        }
      });
  }

  // Process an existing pending payment
  private processExistingPayment(amount: number): Observable<any> {
    // Use the service method to process existing payment
    return this.paymentProcessingService.processExistingPayment(this.currentReservationId!);
  }

  // Create a new onsite payment
  private createNewOnsitePayment(amount: number): Observable<any> {
    const sessionRequest = {
      reservationId: this.currentReservationId!,
      amount: amount,
      currency: 'USD',
      successUrl: `${window.location.origin}/reservations`,
      cancelUrl: `${window.location.origin}/vehicles/${this.vehicle?.id}`,
      providerName: 'onSitePaymentProvider'
    };

    // Only create payment session (creates Payment entity in PENDING status)
    // DO NOT automatically process the payment - it requires admin approval
    return this.paymentProcessingService.createPaymentSession(sessionRequest);
  }

  saveForLater(): void {
    if (this.currentReservationId) {
      // Ensure booking context is saved when saving for later
      this.saveBookingContextForReservation(this.currentReservationId);
      
      this.toastr.success('Reservation saved with booking preferences. You can complete payment from your reservations page.', 'Saved for Later');
      this.closeBooking();
      this.router.navigate(['/reservations']);
    } else {
      this.toastr.error('No reservation to save. Please complete the booking first.', 'Error');
    }
  }

  // Helper to format date for display (can be moved to a pipe for reusability)
  formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper to get duration label
  getDurationLabel(): string {
    if (this.selectedDuration < 24) {
      return `${this.selectedDuration} hour${this.selectedDuration > 1 ? 's' : ''}`;
    } else if (this.selectedDuration < 168) {
      return `${Math.round(this.selectedDuration / 24)} day${Math.round(this.selectedDuration / 24) > 1 ? 's' : ''}`;
    } else {
      return `${Math.round(this.selectedDuration / 168)} week${Math.round(this.selectedDuration / 168) > 1 ? 's' : ''}`;
    }
  }

  // Handle payment confirmation when returning from payment provider
  handlePaymentConfirmation(sessionId: string): void {
    if (!sessionId) return;

    this.paymentProcessingService.confirmPayment(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Payment confirmed successfully! Your reservation is now active.', 'Payment Confirmed');

          // Check reservation status after payment confirmation
          if (this.currentReservationId) {
            this.checkReservationStatus();
          }

          this.closeBooking();
          // Optionally navigate to reservations page
          // this.router.navigate(['/reservations']);
        },
        error: (err: any) => {
          console.error('Payment confirmation failed:', err);
          this.toastr.error('Payment confirmation failed. Please contact support.', 'Payment Error');
        }
      });
  }

  // Check and display current payment status
  checkPaymentStatus(): void {
    if (!this.currentReservationId) return;
    
    this.paymentProcessingService.getPaymentStatus(this.currentReservationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paymentResult: any) => {
          if (paymentResult.success) {
            switch (paymentResult.status) {
              case 'PENDING':
                this.toastr.info('Payment is pending. Please complete payment at the location to confirm your reservation.', 'Payment Status');
                break;
              case 'COMPLETED':
                this.toastr.success('Payment completed! Your reservation is confirmed.', 'Payment Status');
                break;
              case 'FAILED':
                this.toastr.error('Payment failed. Please try again or contact support.', 'Payment Status');
                break;
              default:
                this.toastr.info(`Payment status: ${paymentResult.status}`, 'Payment Status');
            }
          }
        },
        error: (err: any) => {
          console.error('Failed to check payment status:', err);
        }
      });
  }

  // Complete payment flow after successful payment
  completePaymentFlow(): void {
    if (!this.currentReservationId) return;

    // Check payment status
    this.checkPaymentStatus();

    // If payment is completed, close the booking
    setTimeout(() => {
      if (!this.paymentError) {
        this.toastr.success('Payment completed successfully! Your reservation is confirmed.', 'Payment Complete');
        this.closeBooking();
      }
    }, 1000);
  }

  // Handle payment completion from external provider
  handleExternalPaymentCompletion(sessionId: string, status: string): void {
    if (status === 'completed') {
      this.toastr.success('Payment completed successfully! Your reservation is confirmed.', 'Payment Complete');
      this.closeBooking();
    } else if (status === 'failed') {
      this.paymentError = 'Payment failed. Please try again or contact support.';
      this.isProcessingPayment = false;
    } else if (status === 'cancelled') {
      this.toastr.info('Payment was cancelled. Your reservation is saved for later completion.', 'Payment Cancelled');
      this.closeBooking();
    }
  }

  // Check reservation status after payment confirmation
  checkReservationStatus(): void {
    if (!this.currentReservationId) return;

    this.reservationService.getReservationById(this.currentReservationId).subscribe({
      next: (reservation: any) => {
        console.log('Reservation status after payment:', reservation.status);

        if (reservation.status === 'CONFIRMED') {
          this.toastr.success('Reservation confirmed! Your booking is now active.', 'Reservation Status');
        } else if (reservation.status === 'PENDING') {
          this.toastr.info('Reservation is still pending. Please wait for confirmation.', 'Reservation Status');
        } else if (reservation.status === 'CANCELLED') {
          this.toastr.error('Reservation was cancelled. Please contact support.', 'Reservation Status');
        }
      },
      error: (err: any) => {
        console.error('Failed to check reservation status:', err);
      }
    });
  }

  // Handle payment cancellation
  cancelPayment(): void {
    if (this.currentReservationId) {
      this.toastr.info('Payment cancelled. Your reservation is saved for later completion.', 'Payment Cancelled');
      this.closeBooking();
    } else {
      this.toastr.error('No active payment to cancel.', 'Error');
    }
  }

  // Create payment session with proper error handling
  private createPaymentSession(provider: string): void {
    if (!this.currentReservationId || !this.vehicle) return;

    const totalAmount = this.formatAmountForApi(this.vehicle.pricePerDay * Math.ceil(this.selectedDuration / 24));

    const sessionRequest = {
      amount: totalAmount,
      currency: 'USD',
      reservationId: this.currentReservationId,
      successUrl: `${window.location.origin}/payments/success`,
      cancelUrl: `${window.location.origin}/payments/cancel`,
      providerName: `${provider}PaymentProvider`
    };

    this.paymentProcessingService.createPaymentSession(sessionRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.toastr.success(`Payment session created for ${provider}! Redirecting...`, 'Payment Session Created');
          if (response.redirectUrl) {
            // Store session info for later confirmation
            localStorage.setItem('currentPaymentSession', JSON.stringify({
              sessionId: response.sessionId,
              reservationId: this.currentReservationId,
              provider: provider
            }));
            window.location.href = response.redirectUrl;
        }
        },
        error: (err: any) => {
          console.error('Failed to create payment session:', err);
          this.paymentError = err?.error?.message || 'Failed to create payment session';
          this.isProcessingPayment = false;
        }
      });
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }

  // Calculate total payment amount
  getTotalPaymentAmount(): number {
    if (!this.vehicle || !this.selectedDuration) return 0;
    const amount = this.paymentProcessingService.calculatePaymentAmountByHours(this.vehicle.pricePerDay, this.selectedDuration);
    // Ensure consistent decimal precision (2 decimal places for currency)
    return this.formatAmountForApi(amount);
  }

  // Format currency for display
  formatCurrency(amount: number): string {
    return this.paymentProcessingService.formatCurrency(amount, 'USD');
  }

  // Check if payment method is available
  isPaymentMethodAvailable(methodId: string): boolean {
    return this.paymentProcessingService.isPaymentMethodAvailable(methodId, this.availablePaymentMethods);
  }

  // Helper to format amount for API (e.g., to 2 decimal places)
  private formatAmountForApi(amount: number): number {
    return Number(amount.toFixed(2));
  }

  // Testimonial methods
  private initializeTestimonialForm(): void {
    this.testimonialForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  setRating(rating: number): void {
    this.testimonialRating = rating;
  }

  private checkIfUserHasSubmittedTestimonial(vehicleId: number): void {
    if (!this.isLoggedIn) return;
    
    this.testimonialService.getMyTestimonials({ vehicleId }).subscribe({
      next: (testimonials) => {
        this.hasSubmittedTestimonial = testimonials.length > 0;
      },
      error: (error) => {
        console.error('Error checking user testimonials:', error);
      }
    });
  }

  submitTestimonial(): void {
    if (this.testimonialForm.invalid || this.testimonialRating === 0 || !this.vehicle) {
      this.toastr.error('Please fill in all required fields and provide a rating');
      return;
    }

    this.isSubmittingTestimonial = true;
    
    const testimonialData = {
      vehicleId: this.vehicle.id,
      title: this.testimonialForm.get('title')?.value,
      content: this.testimonialForm.get('content')?.value,
      rating: this.testimonialRating
    };

    this.testimonialService.createTestimonial(testimonialData).subscribe({
      next: (testimonial) => {
        this.toastr.success('Thank you for your review! It will be published after moderation.');
        this.hasSubmittedTestimonial = true;
        this.testimonialForm.reset();
        this.testimonialRating = 0;
        this.isSubmittingTestimonial = false;
        
        // Reload testimonials to show the new one if it's auto-approved
        this.loadVehicleTestimonials(this.vehicle!.id);
      },
      error: (error) => {
        console.error('Error submitting testimonial:', error);
        this.toastr.error('Failed to submit your review. Please try again.');
        this.isSubmittingTestimonial = false;
      }
    });
  }



  loadMoreTestimonials(): void {
    if (!this.vehicle || this.loadingMoreTestimonials) return;
    
    this.loadingMoreTestimonials = true;
    this.testimonialPage++;
    
    // Simulate loading more testimonials
    setTimeout(() => {
      // Add more mock testimonials for demonstration
      const newTestimonials = [
        {
          id: this.vehicleTestimonials.length + 1,
          userId: 3,
          vehicleId: this.vehicle!.id,
          title: "Outstanding Service",
          content: "The vehicle was in perfect condition and the rental process was seamless. Highly recommended for business trips!",
          rating: 5,
          approved: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          userName: "Alex Johnson",
          vehicleBrand: this.vehicle!.brand,
          vehicleModel: this.vehicle!.model
        }
      ];
      
      this.vehicleTestimonials.push(...newTestimonials);
      this.loadingMoreTestimonials = false;
      
      // Simulate no more testimonials after a few loads
      if (this.testimonialPage >= 2) {
        this.hasMoreTestimonials = false;
      }
    }, 1500);

    // TODO: Replace with actual API call
    // this.testimonialService.getVehicleTestimonials(this.vehicle.id, this.testimonialPage, this.testimonialPageSize).subscribe(...)
  }
}
