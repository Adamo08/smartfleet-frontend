import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface BookingContext {
  // Vehicle information
  vehicleId: number | null;
  vehiclePricePerDay: number | null;
  
  // Booking preferences
  slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  duration: number; // in hours
  
  // Date selection
  startDate: Date | null;
  endDate: Date | null;
  
  // Pricing details
  calculationMethod: 'SLOT_BASED' | 'DATE_RANGE' | 'DURATION_BASED';
  totalAmount: number | null;
  
  // Additional context
  comment?: string;
  selectedSlotIds?: number[];
  
  // Metadata
  createdAt: Date;
  lastModified: Date;
}

export interface BookingPreferences {
  preferredSlotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  preferredDuration: number;
  preferredCalculationMethod: 'SLOT_BASED' | 'DATE_RANGE' | 'DURATION_BASED';
}

@Injectable({
  providedIn: 'root'
})
export class BookingContextService {
  private readonly initialContext: BookingContext = {
    vehicleId: null,
    vehiclePricePerDay: null,
    slotType: 'DAILY',
    duration: 24,
    startDate: null,
    endDate: null,
    calculationMethod: 'DATE_RANGE',
    totalAmount: null,
    createdAt: new Date(),
    lastModified: new Date()
  };

  private readonly contextSubject = new BehaviorSubject<BookingContext>(this.initialContext);
  private readonly context$ = this.contextSubject.asObservable();

  // Public observables
  readonly currentContext$ = this.context$;
  
  readonly vehicleInfo$ = this.context$.pipe(
    map(ctx => ({ vehicleId: ctx.vehicleId, pricePerDay: ctx.vehiclePricePerDay })),
    distinctUntilChanged()
  );
  
  readonly bookingDetails$ = this.context$.pipe(
    map(ctx => ({ 
      slotType: ctx.slotType, 
      duration: ctx.duration, 
      startDate: ctx.startDate, 
      endDate: ctx.endDate 
    })),
    distinctUntilChanged()
  );
  
  readonly pricingInfo$ = this.context$.pipe(
    map(ctx => ({ 
      calculationMethod: ctx.calculationMethod, 
      totalAmount: ctx.totalAmount 
    })),
    distinctUntilChanged()
  );

  // Getters for current state
  get currentContext(): BookingContext {
    return this.contextSubject.value;
  }

  get hasValidBookingContext(): boolean {
    const ctx = this.currentContext;
    return !!(ctx.vehicleId && ctx.startDate && ctx.endDate && ctx.duration > 0);
  }

  get isBookingComplete(): boolean {
    const ctx = this.currentContext;
    return this.hasValidBookingContext && !!ctx.totalAmount;
  }

  // Context management methods
  initializeBookingContext(vehicleId: number, vehiclePricePerDay: number): void {
    this.updateContext({
      vehicleId,
      vehiclePricePerDay,
      createdAt: new Date(),
      lastModified: new Date()
    });
  }

  setBookingDates(startDate: Date, endDate: Date): void {
    this.updateContext({
      startDate,
      endDate,
      lastModified: new Date()
    });
  }

  setSlotType(slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM', duration?: number): void {
    const updates: Partial<BookingContext> = {
      slotType,
      lastModified: new Date()
    };
    
    if (duration) {
      updates.duration = duration;
    }
    
    this.updateContext(updates);
  }

  setDuration(duration: number): void {
    this.updateContext({
      duration,
      lastModified: new Date()
    });
  }

  setCalculationMethod(method: 'SLOT_BASED' | 'DATE_RANGE' | 'DURATION_BASED'): void {
    this.updateContext({
      calculationMethod: method,
      lastModified: new Date()
    });
  }

  setTotalAmount(amount: number): void {
    this.updateContext({
      totalAmount: amount,
      lastModified: new Date()
    });
  }

  setComment(comment: string): void {
    this.updateContext({
      comment,
      lastModified: new Date()
    });
  }

  setSelectedSlots(slotIds: number[]): void {
    this.updateContext({
      selectedSlotIds: slotIds,
      calculationMethod: 'SLOT_BASED',
      lastModified: new Date()
    });
  }

  // Context persistence methods
  saveContextForReservation(reservationId: number): void {
    const contextKey = `booking_context_${reservationId}`;
    const contextData = {
      ...this.currentContext,
      reservationId
    };
    
    try {
      localStorage.setItem(contextKey, JSON.stringify(contextData));
      console.log(`Booking context saved for reservation ${reservationId}`);
    } catch (error) {
      console.warn('Failed to save booking context to localStorage:', error);
    }
  }

  loadContextForReservation(reservationId: number): boolean {
    const contextKey = `booking_context_${reservationId}`;
    
    try {
      const savedContext = localStorage.getItem(contextKey);
      if (savedContext) {
        const contextData = JSON.parse(savedContext);
        // Convert date strings back to Date objects
        if (contextData.startDate) contextData.startDate = new Date(contextData.startDate);
        if (contextData.endDate) contextData.endDate = new Date(contextData.endDate);
        if (contextData.createdAt) contextData.createdAt = new Date(contextData.createdAt);
        if (contextData.lastModified) contextData.lastModified = new Date(contextData.lastModified);
        
        this.contextSubject.next(contextData);
        console.log(`Booking context loaded for reservation ${reservationId}`);
        return true;
      }
    } catch (error) {
      console.warn('Failed to load booking context from localStorage:', error);
    }
    
    return false;
  }

  clearContextForReservation(reservationId: number): void {
    const contextKey = `booking_context_${reservationId}`;
    try {
      localStorage.removeItem(contextKey);
      console.log(`Booking context cleared for reservation ${reservationId}`);
    } catch (error) {
      console.warn('Failed to clear booking context from localStorage:', error);
    }
  }

  // User preferences management
  saveUserPreferences(): void {
    const preferences: BookingPreferences = {
      preferredSlotType: this.currentContext.slotType,
      preferredDuration: this.currentContext.duration,
      preferredCalculationMethod: this.currentContext.calculationMethod
    };
    
    try {
      localStorage.setItem('booking_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save booking preferences:', error);
    }
  }

  loadUserPreferences(): void {
    try {
      const saved = localStorage.getItem('booking_preferences');
      if (saved) {
        const preferences: BookingPreferences = JSON.parse(saved);
        this.updateContext({
          slotType: preferences.preferredSlotType,
          duration: preferences.preferredDuration,
          calculationMethod: preferences.preferredCalculationMethod
        });
      }
    } catch (error) {
      console.warn('Failed to load booking preferences:', error);
    }
  }

  // Utility methods
  calculateDurationFromDates(): number {
    const { startDate, endDate } = this.currentContext;
    if (!startDate || !endDate) return 0;
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60)); // hours
  }

  updateDurationFromDates(): void {
    const calculatedDuration = this.calculateDurationFromDates();
    if (calculatedDuration > 0) {
      this.setDuration(calculatedDuration);
    }
  }

  resetContext(): void {
    this.contextSubject.next({
      ...this.initialContext,
      createdAt: new Date(),
      lastModified: new Date()
    });
  }

  // Export context for reservation creation
  exportForReservationCreation(): {
    vehicleId: number;
    startDate: Date;
    endDate: Date;
    comment?: string;
    bookingContext: BookingContext;
  } | null {
    if (!this.hasValidBookingContext) {
      return null;
    }
    
    const ctx = this.currentContext;
    return {
      vehicleId: ctx.vehicleId!,
      startDate: ctx.startDate!,
      endDate: ctx.endDate!,
      comment: ctx.comment,
      bookingContext: { ...ctx }
    };
  }

  // Private methods
  private updateContext(partialContext: Partial<BookingContext>): void {
    const currentContext = this.contextSubject.value;
    const newContext = { 
      ...currentContext, 
      ...partialContext,
      lastModified: new Date()
    };
    this.contextSubject.next(newContext);
  }

  // Debug and logging
  logCurrentContext(): void {
    console.log('Current Booking Context:', this.currentContext);
  }

  getContextSummary(): string {
    const ctx = this.currentContext;
    if (!this.hasValidBookingContext) {
      return 'No valid booking context';
    }
    
    return `Vehicle: ${ctx.vehicleId}, Type: ${ctx.slotType}, Duration: ${ctx.duration}h, Amount: $${ctx.totalAmount || 'TBD'}`;
  }
}
