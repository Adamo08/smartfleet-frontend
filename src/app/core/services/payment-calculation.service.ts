import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BookingContext } from './booking-context.service';
import { SlotDto } from '../models/slot.interface';
import { ReservationSummaryDto, DetailedReservationDto } from '../models/reservation.interface';

export interface PaymentCalculationResult {
  totalAmount: number;
  currency: string;
  breakdown: PaymentBreakdown;
  calculationMethod: 'SLOT_BASED' | 'DATE_RANGE' | 'DURATION_BASED' | 'DEFAULT';
  metadata: {
    vehicleId: number;
    pricePerDay: number;
    duration: number; // in hours
    durationDays: number;
    startDate: Date;
    endDate: Date;
  };
}

export interface PaymentBreakdown {
  baseAmount: number;
  duration: number; // in hours
  durationDays: number;
  rate: number; // per day or per hour
  rateType: 'DAILY' | 'HOURLY';
  
  // Optional additional charges
  fees?: {
    serviceFee?: number;
    taxes?: number;
    insurance?: number;
  };
  
  // Discounts
  discounts?: {
    longTermDiscount?: number;
    loyaltyDiscount?: number;
  };
}

export interface PricingOptions {
  includeFees?: boolean;
  includeDiscounts?: boolean;
  currency?: string;
  roundToNearestCent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentCalculationService {
  private readonly DEFAULT_CURRENCY = 'USD';
  private readonly DEFAULT_DURATION_HOURS = 24;

  constructor() {}

  /**
   * Main calculation method - determines the best calculation approach
   */
  calculatePaymentAmount(
    reservation: ReservationSummaryDto | DetailedReservationDto,
    bookingContext?: BookingContext,
    options: PricingOptions = {}
  ): PaymentCalculationResult {
    
    // Determine calculation method priority:
    // 1. Use booking context if available (most accurate)
    // 2. Use reservation dates if valid
    // 3. Fall back to default duration
    
    if (bookingContext && this.isValidBookingContext(bookingContext)) {
      return this.calculateFromBookingContext(bookingContext, options);
    }
    
    if (this.hasValidReservationDates(reservation)) {
      return this.calculateFromReservationDates(reservation, options);
    }
    
    // Fallback to default calculation
    return this.calculateDefault(reservation, options);
  }

  /**
   * Calculate from booking context (most accurate)
   */
  calculateFromBookingContext(
    context: BookingContext,
    options: PricingOptions = {}
  ): PaymentCalculationResult {
    
    const vehiclePricePerDay = context.vehiclePricePerDay!;
    const startDate = context.startDate!;
    const endDate = context.endDate!;
    
    let totalAmount: number;
    let breakdown: PaymentBreakdown;
    let calculationMethod: 'SLOT_BASED' | 'DATE_RANGE' | 'DURATION_BASED';
    
    switch (context.calculationMethod) {
      case 'SLOT_BASED':
        ({ totalAmount, breakdown } = this.calculateSlotBased(context, vehiclePricePerDay));
        calculationMethod = 'SLOT_BASED';
        break;
        
      case 'DURATION_BASED':
        ({ totalAmount, breakdown } = this.calculateDurationBased(context.duration, vehiclePricePerDay));
        calculationMethod = 'DURATION_BASED';
        break;
        
      case 'DATE_RANGE':
      default:
        ({ totalAmount, breakdown } = this.calculateDateRangeBased(startDate, endDate, vehiclePricePerDay));
        calculationMethod = 'DATE_RANGE';
        break;
    }
    
    // Apply fees and discounts
    if (options.includeFees || options.includeDiscounts) {
      ({ totalAmount, breakdown } = this.applyFeesAndDiscounts(totalAmount, breakdown, options));
    }
    
    // Round if requested
    if (options.roundToNearestCent !== false) {
      totalAmount = Math.round(totalAmount * 100) / 100;
    }
    
    const durationHours = this.calculateHoursDuration(startDate, endDate);
    
    return {
      totalAmount,
      currency: options.currency || this.DEFAULT_CURRENCY,
      breakdown,
      calculationMethod,
      metadata: {
        vehicleId: context.vehicleId!,
        pricePerDay: vehiclePricePerDay,
        duration: durationHours,
        durationDays: Math.ceil(durationHours / 24),
        startDate,
        endDate
      }
    };
  }

  /**
   * Calculate from reservation dates
   */
  calculateFromReservationDates(
    reservation: ReservationSummaryDto | DetailedReservationDto,
    options: PricingOptions = {}
  ): PaymentCalculationResult {
    
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    const vehiclePricePerDay = reservation.vehicle.pricePerDay;
    
    const { totalAmount, breakdown } = this.calculateDateRangeBased(startDate, endDate, vehiclePricePerDay);
    const durationHours = this.calculateHoursDuration(startDate, endDate);
    
    return {
      totalAmount: options.roundToNearestCent !== false ? Math.round(totalAmount * 100) / 100 : totalAmount,
      currency: options.currency || this.DEFAULT_CURRENCY,
      breakdown,
      calculationMethod: 'DATE_RANGE',
      metadata: {
        vehicleId: reservation.vehicle.id,
        pricePerDay: vehiclePricePerDay,
        duration: durationHours,
        durationDays: Math.ceil(durationHours / 24),
        startDate,
        endDate
      }
    };
  }

  /**
   * Default calculation (fallback)
   */
  calculateDefault(
    reservation: ReservationSummaryDto | DetailedReservationDto,
    options: PricingOptions = {}
  ): PaymentCalculationResult {
    
    const vehiclePricePerDay = reservation.vehicle.pricePerDay;
    const durationHours = this.DEFAULT_DURATION_HOURS;
    
    const { totalAmount, breakdown } = this.calculateDurationBased(durationHours, vehiclePricePerDay);
    
    // Create default dates for metadata
    const now = new Date();
    const endDate = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));
    
    return {
      totalAmount: options.roundToNearestCent !== false ? Math.round(totalAmount * 100) / 100 : totalAmount,
      currency: options.currency || this.DEFAULT_CURRENCY,
      breakdown,
      calculationMethod: 'DEFAULT',
      metadata: {
        vehicleId: reservation.vehicle.id,
        pricePerDay: vehiclePricePerDay,
        duration: durationHours,
        durationDays: Math.ceil(durationHours / 24),
        startDate: now,
        endDate
      }
    };
  }

  /**
   * Specific calculation methods
   */
  private calculateSlotBased(
    context: BookingContext, 
    vehiclePricePerDay: number
  ): { totalAmount: number; breakdown: PaymentBreakdown } {
    
    // For slot-based calculation, we still need to calculate duration
    const durationHours = context.duration;
    const durationDays = Math.ceil(durationHours / 24);
    
    // Slot-based pricing might have different rates based on slot type
    let effectiveRate = vehiclePricePerDay;
    
    switch (context.slotType) {
      case 'HOURLY':
        effectiveRate = vehiclePricePerDay / 24; // Convert to hourly rate
        break;
      case 'WEEKLY':
        effectiveRate = vehiclePricePerDay * 6.5; // 7 days but with weekly discount
        break;
      case 'CUSTOM':
        // Custom logic can be added here
        break;
      case 'DAILY':
      default:
        // Use daily rate as-is
        break;
    }
    
    const baseAmount = context.slotType === 'HOURLY' 
      ? effectiveRate * durationHours
      : effectiveRate * durationDays;
    
    return {
      totalAmount: baseAmount,
      breakdown: {
        baseAmount,
        duration: durationHours,
        durationDays,
        rate: effectiveRate,
        rateType: context.slotType === 'HOURLY' ? 'HOURLY' : 'DAILY'
      }
    };
  }

  private calculateDurationBased(
    durationHours: number, 
    vehiclePricePerDay: number
  ): { totalAmount: number; breakdown: PaymentBreakdown } {
    
    const durationDays = Math.ceil(durationHours / 24);
    const baseAmount = vehiclePricePerDay * durationDays;
    
    return {
      totalAmount: baseAmount,
      breakdown: {
        baseAmount,
        duration: durationHours,
        durationDays,
        rate: vehiclePricePerDay,
        rateType: 'DAILY'
      }
    };
  }

  private calculateDateRangeBased(
    startDate: Date, 
    endDate: Date, 
    vehiclePricePerDay: number
  ): { totalAmount: number; breakdown: PaymentBreakdown } {
    
    const durationHours = this.calculateHoursDuration(startDate, endDate);
    return this.calculateDurationBased(durationHours, vehiclePricePerDay);
  }

  /**
   * Apply fees and discounts
   */
  private applyFeesAndDiscounts(
    baseAmount: number, 
    breakdown: PaymentBreakdown, 
    options: PricingOptions
  ): { totalAmount: number; breakdown: PaymentBreakdown } {
    
    let totalAmount = baseAmount;
    const newBreakdown = { ...breakdown };
    
    if (options.includeFees) {
      const fees = this.calculateFees(baseAmount, breakdown);
      newBreakdown.fees = fees;
      totalAmount += Object.values(fees).reduce((sum, fee) => sum + (fee || 0), 0);
    }
    
    if (options.includeDiscounts) {
      const discounts = this.calculateDiscounts(baseAmount, breakdown);
      newBreakdown.discounts = discounts;
      totalAmount -= Object.values(discounts).reduce((sum, discount) => sum + (discount || 0), 0);
    }
    
    return { totalAmount, breakdown: newBreakdown };
  }

  private calculateFees(baseAmount: number, breakdown: PaymentBreakdown): NonNullable<PaymentBreakdown['fees']> {
    return {
      serviceFee: baseAmount * 0.05, // 5% service fee
      taxes: baseAmount * 0.08, // 8% tax
      insurance: breakdown.durationDays * 5 // $5 per day insurance
    };
  }

  private calculateDiscounts(baseAmount: number, breakdown: PaymentBreakdown): NonNullable<PaymentBreakdown['discounts']> {
    const discounts: NonNullable<PaymentBreakdown['discounts']> = {};
    
    // Long-term discount for bookings over 7 days
    if (breakdown.durationDays >= 7) {
      discounts.longTermDiscount = baseAmount * 0.10; // 10% discount
    }
    
    // Additional discounts can be added here
    // discounts.loyaltyDiscount = ...
    
    return discounts;
  }

  /**
   * Utility methods
   */
  private calculateHoursDuration(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60));
  }

  private isValidBookingContext(context: BookingContext): boolean {
    return !!(
      context.vehicleId &&
      context.vehiclePricePerDay &&
      context.startDate &&
      context.endDate &&
      context.duration > 0
    );
  }

  private hasValidReservationDates(reservation: ReservationSummaryDto | DetailedReservationDto): boolean {
    return !!(reservation.startDate && reservation.endDate);
  }

  /**
   * Public utility methods
   */
  formatCurrency(amount: number, currency: string = this.DEFAULT_CURRENCY): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getDurationLabel(hours: number): string {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  }

  /**
   * Validation methods
   */
  validateCalculationInputs(
    reservation: ReservationSummaryDto | DetailedReservationDto,
    bookingContext?: BookingContext
  ): { isValid: boolean; errors: string[] } {
    
    const errors: string[] = [];
    
    if (!reservation.vehicle?.pricePerDay || reservation.vehicle.pricePerDay <= 0) {
      errors.push('Invalid vehicle price per day');
    }
    
    if (bookingContext) {
      if (!bookingContext.vehicleId) errors.push('Missing vehicle ID in booking context');
      if (!bookingContext.duration || bookingContext.duration <= 0) errors.push('Invalid duration in booking context');
      if (!bookingContext.startDate || !bookingContext.endDate) errors.push('Missing dates in booking context');
      if (bookingContext.startDate && bookingContext.endDate && bookingContext.startDate >= bookingContext.endDate) {
        errors.push('End date must be after start date');
      }
    } else {
      if (!reservation.startDate || !reservation.endDate) {
        errors.push('Missing reservation dates');
      } else {
        const startDate = new Date(reservation.startDate);
        const endDate = new Date(reservation.endDate);
        if (startDate >= endDate) {
          errors.push('End date must be after start date');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Comparison methods for testing different calculation approaches
   */
  compareCalculationMethods(
    reservation: ReservationSummaryDto | DetailedReservationDto,
    bookingContext?: BookingContext
  ): {
    default: PaymentCalculationResult;
    dateRange?: PaymentCalculationResult;
    bookingContext?: PaymentCalculationResult;
    recommended: PaymentCalculationResult;
  } {
    
    const results: any = {
      default: this.calculateDefault(reservation)
    };
    
    if (this.hasValidReservationDates(reservation)) {
      results.dateRange = this.calculateFromReservationDates(reservation);
    }
    
    if (bookingContext && this.isValidBookingContext(bookingContext)) {
      results.bookingContext = this.calculateFromBookingContext(bookingContext);
    }
    
    // Determine recommended calculation
    results.recommended = results.bookingContext || results.dateRange || results.default;
    
    return results;
  }
}
