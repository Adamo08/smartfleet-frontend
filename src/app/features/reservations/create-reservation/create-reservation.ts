import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { BookingService } from '../../../core/services/booking.service';
import { SlotService } from '../../../core/services/slot.service';
import { VehicleService } from '../../../core/services/vehicle';
import {
  CreateReservationRequest,
  ReservationFilter
} from '../../../core/models/reservation.interface';
import { SlotDto } from '../../../core/models/slot.interface';
import { Vehicle } from '../../../core/models/vehicle.interface';
import { PaymentRequestDto } from '../../../core/models/payment.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';
import { Page } from '../../../core/models/pagination.interface';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './create-reservation.html',
  styleUrl: './create-reservation.css'
})
export class CreateReservation implements OnInit, OnDestroy {
  reservationForm: FormGroup;
  availableSlots: SlotDto[] = [];
  selectedVehicle: Vehicle | null = null;
  selectedSlot: SlotDto | null = null;
  availableVehicles: Vehicle[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Date and time selection
  selectedDate: Date | null = null;
  selectedStartTime: string = '';
  selectedEndTime: string = '';

  // Booking details
  bookingDuration: number = 0;
  estimatedCost: number = 0;
  hourlyRate: number = 50; // Default hourly rate

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private slotService: SlotService,
    private vehicleService: VehicleService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.reservationForm = this.fb.group({
      vehicleId: ['', Validators.required],
      slotId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    // Set default dates (next day, 9 AM to 5 PM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(17, 0, 0, 0);

    this.reservationForm.patchValue({
      startDate: tomorrow,
      endDate: endTime
    });

    // Watch for form changes to update available slots
    this.reservationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(changes => {
        if (changes.vehicleId && changes.startDate && changes.endDate) {
          this.onFormChange();
        }
      });
  }

  private loadInitialData(): void {
    // Load vehicle if provided in route
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        map(params => params['vehicleId']),
        switchMap(vehicleId => {
          if (vehicleId) {
            return this.vehicleService.getVehicleById(vehicleId);
          }
          // Provide default Pageable for getVehicles()
          return this.vehicleService.getVehicles({ page: 0, size: 100, sortBy: 'id', sortDirection: 'ASC' });
        })
      )
      .subscribe({
        next: (response) => {
          // Check if it's a single Vehicle or a Page<Vehicle>
          if ('id' in response) {
            // Single vehicle
            this.selectedVehicle = response as Vehicle;
            this.reservationForm.patchValue({ vehicleId: (response as Vehicle).id });
          } else if ('content' in response) {
            // Page<Vehicle>
            this.availableVehicles = (response as Page<Vehicle>).content;
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load vehicle information';
          console.error('Error loading vehicle:', error);
        }
      });
  }

  private onFormChange(): void {
    const { vehicleId, startDate, endDate } = this.reservationForm.value;

    if (vehicleId && startDate && endDate) {
      this.loadAvailableSlots(vehicleId, startDate, endDate);
      this.calculateBookingDetails(startDate, endDate);
    }
  }

  private loadAvailableSlots(vehicleId: number, startDate: Date, endDate: Date): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bookingService.checkAvailability(vehicleId, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.availableSlots = result.availableSlots;
          this.isLoading = false;

          if (result.availableSlots.length === 0) {
            this.errorMessage = 'No available slots for the selected date and time.';
            this.suggestAlternativeSlots(vehicleId, startDate, endDate);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to check availability. Please try again.';
          console.error('Error checking availability:', error);
        }
      });
  }

  private suggestAlternativeSlots(vehicleId: number, startDate: Date, endDate: Date): void {
    this.bookingService.suggestAlternativeSlots(vehicleId, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alternatives) => {
          // Handle alternative suggestions
          console.log('Alternative slots:', alternatives);
        },
        error: (error) => {
          console.error('Error getting alternatives:', error);
        }
      });
  }

  private calculateBookingDetails(startDate: Date, endDate: Date): void {
    const details = this.bookingService.calculateBookingDetails(startDate, endDate, this.hourlyRate);
    this.bookingDuration = details.duration;
    this.estimatedCost = details.totalCost;
  }

  onSlotSelect(slot: SlotDto): void {
    this.selectedSlot = slot;
    this.reservationForm.patchValue({
      slotId: slot.id,
      startDate: slot.startTime,
      endDate: slot.endTime
    });
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    this.updateTimeSlots();
  }

  private updateTimeSlots(): void {
    if (this.selectedDate && this.selectedVehicle) {
      this.slotService.getAvailableSlotsByVehicle(this.selectedVehicle.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (slots: SlotDto[]) => {
            this.availableSlots = slots;
          },
          error: (error: any) => {
            console.error('Error loading time slots:', error);
          }
        });
    }
  }

  onSubmit(): void {
    if (this.reservationForm.valid && this.selectedSlot) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const reservationRequest: CreateReservationRequest = this.reservationForm.value;

      // Create payment request (this would typically come from a payment form)
      const paymentRequest: PaymentRequestDto = {
        reservationId: 0, // Will be set by the service
        amount: this.estimatedCost,
        currency: 'MAD',
        paymentMethodId: 'default',
        providerName: 'default'
      };

      this.bookingService.completeBooking(reservationRequest, paymentRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            this.isLoading = false;
            this.successMessage = 'Reservation created successfully!';

            // Redirect to reservation detail or payment page
            setTimeout(() => {
              this.router.navigate(['/reservations', result.reservation.id]);
            }, 2000);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Failed to create reservation. Please try again.';
            console.error('Error creating reservation:', error);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.reservationForm.controls).forEach(key => {
      const control = this.reservationForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/reservations']);
  }

  // Helper methods for template
  getFormControl(name: string) {
    return this.reservationForm.get(name);
  }

  isFieldInvalid(name: string): boolean {
    const control = this.getFormControl(name);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(name: string): string {
    const control = this.getFormControl(name);
    if (control && control.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }

  getDuration(): string {
    if (!this.selectedSlot) return '0 hours';

    const start = new Date(this.selectedSlot.startTime);
    const end = new Date(this.selectedSlot.endTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
}
