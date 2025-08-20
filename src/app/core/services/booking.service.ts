import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SlotService } from './slot.service';
import { ReservationService } from './reservation.service';
import { PaymentService } from './payment.service';
import { 
  CreateReservationRequest, 
  DetailedReservationDto,
  ReservationFilter 
} from '../models/reservation.interface';
import { SlotDto, SlotFilter } from '../models/slot.interface';
import { PaymentRequestDto, PaymentResponseDto } from '../models/payment.interface';
import { Pageable } from '../models/pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(
    private slotService: SlotService,
    private reservationService: ReservationService,
    private paymentService: PaymentService
  ) {}

  /**
   * Complete booking process: check availability, create reservation, and process payment
   */
  completeBooking(
    reservationRequest: CreateReservationRequest,
    paymentRequest: PaymentRequestDto
  ): Observable<{
    reservation: DetailedReservationDto;
    payment: PaymentResponseDto;
  }> {
    // Rely on backend validation (slot state and times). Remove admin-only slot check.
    return this.createReservation(reservationRequest).pipe(
      switchMap(reservation => 
        this.processPayment({
          ...paymentRequest,
          reservationId: reservation.id
        }).pipe(
          map(payment => ({ reservation, payment }))
        )
      ),
      catchError(error => {
        // If payment fails, we should handle the reservation accordingly
        console.error('Booking failed:', error);
        return throwError(() => new Error('Booking process failed. Please try again.'));
      })
    );
  }

  /**
   * Check vehicle availability for a date range
   */
  checkAvailability(vehicleId: number, startDate: Date, endDate: Date): Observable<{
    isAvailable: boolean;
    availableSlots: SlotDto[];
    conflictingReservations?: any[];
  }> {
    return forkJoin({
      availableSlots: this.slotService.getAvailableSlotsInRange(vehicleId, startDate, endDate),
      availabilityCheck: this.reservationService.checkVehicleAvailability(vehicleId, startDate, endDate)
    }).pipe(
      map(result => ({
        isAvailable: result.availabilityCheck && result.availableSlots.length > 0,
        availableSlots: result.availableSlots
      }))
    );
  }

  /**
   * Get available time slots for a vehicle on a specific date
   */
  getAvailableTimeSlots(vehicleId: number, date: Date): Observable<SlotDto[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.slotService.getAvailableSlotsInRange(vehicleId, startOfDay, endOfDay);
  }

  /**
   * Get available time slots for a vehicle within a date range
   */
  getAvailableTimeSlotsInRange(
    vehicleId: number, 
    startDate: Date, 
    endDate: Date
  ): Observable<SlotDto[]> {
    return this.slotService.getAvailableSlotsInRange(vehicleId, startDate, endDate);
  }

  /**
   * Suggest alternative time slots if requested slot is unavailable
   */
  suggestAlternativeSlots(
    vehicleId: number, 
    preferredStartDate: Date, 
    preferredEndDate: Date,
    searchRange: number = 7 // days to search forward/backward
  ): Observable<{
    before: SlotDto[];
    after: SlotDto[];
    sameTimeDifferentDays: SlotDto[];
  }> {
    const beforeDate = new Date(preferredStartDate);
    beforeDate.setDate(beforeDate.getDate() - searchRange);
    
    const afterDate = new Date(preferredEndDate);
    afterDate.setDate(afterDate.getDate() + searchRange);

    return forkJoin({
      before: this.slotService.getAvailableSlotsInRange(vehicleId, beforeDate, preferredStartDate),
      after: this.slotService.getAvailableSlotsInRange(vehicleId, preferredEndDate, afterDate),
      sameTimeDifferentDays: this.findSameTimeSlots(vehicleId, preferredStartDate, preferredEndDate, searchRange)
    });
  }

  /**
   * Calculate booking duration and estimated cost
   */
  calculateBookingDetails(
    startDate: Date, 
    endDate: Date, 
    hourlyRate: number
  ): {
    duration: number; // in hours
    totalCost: number;
    breakdown: {
      hours: number;
      rate: number;
      total: number;
    };
  } {
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const totalCost = durationHours * hourlyRate;

    return {
      duration: durationHours,
      totalCost,
      breakdown: {
        hours: durationHours,
        rate: hourlyRate,
        total: totalCost
      }
    };
  }

  /**
   * Validate booking request before processing
   */
  // Removed client-side slot availability check (admin-protected). Backend enforces it.

  /**
   * Create reservation
   */
  private createReservation(request: CreateReservationRequest): Observable<DetailedReservationDto> {
    return this.reservationService.createReservation(request);
  }

  /**
   * Process payment
   */
  private processPayment(request: PaymentRequestDto): Observable<PaymentResponseDto> {
    return this.paymentService.processPayment(request);
  }

  /**
   * Find slots with the same time on different days
   */
  private findSameTimeSlots(
    vehicleId: number, 
    startDate: Date, 
    endDate: Date, 
    searchRange: number
  ): Observable<SlotDto[]> {
    const startTime = startDate.getHours() * 60 + startDate.getMinutes();
    const endTime = endDate.getHours() * 60 + endDate.getMinutes();
    const duration = endTime - startTime;

    // This would need to be implemented in the backend for efficiency
    // For now, we'll return an empty array
    return of([]);
  }

  /**
   * Cancel booking and handle cleanup
   */
  cancelBooking(reservationId: number): Observable<DetailedReservationDto> {
    return this.reservationService.cancelReservation(reservationId);
  }

  /**
   * Get booking history for current user
   */
  getBookingHistory(pageable: Pageable): Observable<any> {
    return this.reservationService.getReservationsForCurrentUser(pageable);
  }

  /**
   * Get upcoming bookings for current user
   */
  getUpcomingBookings(): Observable<any[]> {
    const pageable: Pageable = { page: 0, size: 10 };
    return this.reservationService.getReservationsForCurrentUser(pageable).pipe(
      map(page => page.content.filter(booking => 
        new Date(booking.startDate) > new Date()
      ))
    );
  }
}
