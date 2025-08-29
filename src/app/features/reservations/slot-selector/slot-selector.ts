import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { SlotService } from '../../../core/services/slot.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { SlotDto } from '../../../core/models/slot.interface';
import { Vehicle } from '../../../core/models/vehicle.interface';

export interface SlotTypeOption {
  value: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  label: string;
  description: string;
  minDuration: number; // in hours
  maxDuration: number; // in hours
}

@Component({
  selector: 'app-slot-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slot-selector.html',
  styleUrl: './slot-selector.css'
})
export class SlotSelector implements OnInit, OnDestroy, OnChanges {
  @Input() vehicleId: number = 0;
  @Input() vehicle: Vehicle | null = null;
  @Input() showDatePicker: boolean = true;
  @Input() includeUnavailable: boolean = false;
  @Input() selectedSlotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM' = 'DAILY';

  // Flag to determine if slot type selection should be shown
  isSlotTypePreSelected: boolean = false;

  @Output() dateRangeSelected = new EventEmitter<{
    startDate: Date,
    endDate: Date,
    hasSlots: boolean,
    slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM',
    duration: number // in hours
  }>();

  // Slot type selection
  slotTypeOptions: SlotTypeOption[] = [
    { 
      value: 'HOURLY', 
      label: 'Hourly', 
      description: 'Perfect for quick trips and short-term needs (1-23 hours)', 
      minDuration: 1, 
      maxDuration: 23 
    },
    { 
      value: 'DAILY', 
      label: 'Daily', 
      description: 'Great for day trips and weekend getaways (1-7 days)', 
      minDuration: 24, 
      maxDuration: 168 
    },
    { 
      value: 'WEEKLY', 
      label: 'Weekly', 
      description: 'Best value for extended trips and vacations (1-4 weeks)', 
      minDuration: 168, 
      maxDuration: 720 
    },
    { 
      value: 'CUSTOM', 
      label: 'Custom', 
      description: 'Flexible duration for any time range up to 1 year', 
      minDuration: 1, 
      maxDuration: 8760 
    }
  ];

  selectedDuration: number = 24; // Default to 1 day in hours

  availableSlots: SlotDto[] = [];
  isLoading = false;
  errorMessage = '';

  // Date range selection
  selectedStartDate: Date = new Date();
  selectedEndDate: Date = new Date();

  // Hourly selection properties
  selectedStartHour: number = 9; // 9 AM default
  selectedEndHour: number = 10; // 10 AM default

  // Calendar navigation
  currentMonth = new Date();
  calendarDays: Date[] = [];

  // Multi-day selection state
  isSelectingRange = false;
  tempStartDate: Date | null = null;

  // Enhanced availability tracking
  blockedDates: Set<string> = new Set(); // Dates with existing reservations
  partiallyAvailableDates: Set<string> = new Set(); // Dates with some slots taken
  
  private destroy$ = new Subject<void>();

  constructor(
    private slotService: SlotService,
    private reservationService: ReservationService
  ) {
    this.initDateRange();
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.updateDurationBasedOnSlotType();
    this.loadBlockedDates();
    this.loadAvailableSlots();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if slot type is pre-selected by parent component
    if (changes['selectedSlotType']) {
      // If selectedSlotType was explicitly set by parent (not default value)
      this.isSlotTypePreSelected = changes['selectedSlotType'].currentValue !== 'DAILY' || 
                                   !changes['selectedSlotType'].firstChange;
      
      if (!changes['selectedSlotType'].firstChange) {
        this.updateDurationBasedOnSlotType();
        this.updateEndDateBasedOnDuration();
        this.loadAvailableSlots();
      }
    }
    
    // Also check for vehicle input changes
    if (changes['vehicle'] && !changes['vehicle'].firstChange) {
      this.loadAvailableSlots();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDateRange(): void {
    const today = new Date();
    this.selectedStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Default to 1 day from now for end date
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    this.selectedEndDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  }

  onSlotTypeChange(): void {
    this.updateDurationBasedOnSlotType();
    this.updateEndDateBasedOnDuration();
    // Clear current selection when changing slot type
    this.clearSelection();
    this.initDateRange();
    // Don't load slots immediately - wait for user to select dates
  }

  onDurationChange(): void {
    this.updateEndDateBasedOnDuration();
    // Only load slots if we have a complete date range
    if (this.selectedStartDate && this.selectedEndDate && this.selectedStartDate !== this.selectedEndDate) {
      this.loadAvailableSlots();
    }
  }

  private updateDurationBasedOnSlotType(): void {
    const selectedOption = this.slotTypeOptions.find(opt => opt.value === this.selectedSlotType);
    if (selectedOption) {
      this.selectedDuration = selectedOption.minDuration;
    }
  }

  private updateEndDateBasedOnDuration(): void {
    if (this.selectedStartDate) {
      const endDate = new Date(this.selectedStartDate);
      endDate.setHours(endDate.getHours() + this.selectedDuration);
      this.selectedEndDate = endDate;
    }
  }

  /**
   * Calculate duration in hours based on selected date range
   * This method provides a more intuitive calculation for users
   */
  private calculateDurationFromDateRange(startDate: Date, endDate: Date): number {
    // Strip time to work with full days only
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Calculate the difference in days
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // Convert to hours (each day is 24 hours)
    return diffDays * 24;
  }

  private generateCalendarDays(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the first day of the week (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay();

    // Get the last day of the month
    const lastDate = lastDay.getDate();

    this.calendarDays = [];

    // Add days from previous month to fill the first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      this.calendarDays.push(prevDate);
    }

    // Add days of current month
    for (let i = 1; i <= lastDate; i++) {
      this.calendarDays.push(new Date(year, month, i));
    }

    // Add days from next month to fill the last week
    const remainingDays = 42 - this.calendarDays.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push(new Date(year, month + 1, i));
    }
  }

  private loadBlockedDates(): void {
    if (!this.vehicleId) return;

    // Load blocked dates for the next 3 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);

    this.reservationService.getBlockedDatesForVehicle(this.vehicleId, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blockedDateStrings) => {
          this.blockedDates = new Set(blockedDateStrings);
        },
        error: (error) => {
          console.error('Error loading blocked dates:', error);
          // Don't show error to user as this is not critical
        }
      });
  }

  public loadAvailableSlots(): void {
    if (!this.vehicleId || !this.selectedStartDate || !this.selectedEndDate) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Use getAllSlotsInRange from service, which now returns dynamic slots with booking type
    this.slotService.getAllSlotsInRange(this.vehicleId, this.selectedStartDate, this.selectedEndDate, this.selectedSlotType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.isLoading = false;

          // Check if any available slots exist for the selected range
          const hasAvailableSlots = slots.some(slot => slot.available);

          // Emit the selected date range and whether any slots are available
          this.dateRangeSelected.emit({
            startDate: this.selectedStartDate,
            endDate: this.selectedEndDate,
            hasSlots: hasAvailableSlots,
            slotType: this.selectedSlotType,
            duration: this.selectedDuration
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load available slots';
          console.error('Error loading slots:', error);
          this.dateRangeSelected.emit({
            startDate: this.selectedStartDate,
            endDate: this.selectedEndDate,
            hasSlots: false,
            slotType: this.selectedSlotType,
            duration: this.selectedDuration
          });
        }
      });
  }

  onDateSelect(date: Date): void {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date object passed to onDateSelect', date);
      return;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return; // Don't allow selecting past dates
    }

    if (!this.isSelectingRange) {
      // Start selecting a range - first click
      this.isSelectingRange = true;
      this.tempStartDate = new Date(date);
      this.selectedStartDate = new Date(date);
      this.selectedEndDate = new Date(date);

      // Clear previous selection
      this.selectedDuration = 24; // Default to 1 day
    } else {
      // Complete the range selection - second click
      if (this.tempStartDate && date >= this.tempStartDate) {
        this.selectedStartDate = new Date(this.tempStartDate);
        this.selectedEndDate = new Date(date);
      } else if (this.tempStartDate && date < this.tempStartDate) {
        this.selectedStartDate = new Date(date);
        this.selectedEndDate = new Date(this.tempStartDate);
      }

      this.isSelectingRange = false;
      this.tempStartDate = null;

      // Update duration based on selected range using intuitive day-based calculation
      this.selectedDuration = this.calculateDurationFromDateRange(this.selectedStartDate, this.selectedEndDate);

      // Check if selected range is available
      if (!this.isDateRangeAvailable(this.selectedStartDate, this.selectedEndDate)) {
        this.errorMessage = `Selected date range is not available for ${this.selectedSlotType.toLowerCase()} bookings. Please choose different dates.`;
        return;
      }

      // Adjust slot type based on duration
      this.adjustSlotTypeBasedOnDuration();

      // Only load slots after range is complete
      this.loadAvailableSlots();
    }
  }

  private adjustSlotTypeBasedOnDuration(): void {
    const currentOption = this.slotTypeOptions.find(option => option.value === this.selectedSlotType);
    
    // Only auto-adjust if current selection doesn't fit the duration
    if (!currentOption || 
        this.selectedDuration < currentOption.minDuration || 
        this.selectedDuration > currentOption.maxDuration) {
      
      if (this.selectedDuration <= 23) {
        this.selectedSlotType = 'HOURLY';
      } else if (this.selectedDuration <= 168) { // 7 days
        this.selectedSlotType = 'DAILY';
      } else if (this.selectedDuration <= 720) { // 30 days
        this.selectedSlotType = 'WEEKLY';
      } else {
        this.selectedSlotType = 'CUSTOM';
      }
    }
  }

  /**
   * Check if a date range is available for the selected booking type
   */
  private isDateRangeAvailable(startDate: Date, endDate: Date): boolean {
    const startDateKey = this.getDateKey(startDate);
    const endDateKey = this.getDateKey(endDate);
    
    // For hourly bookings, check if any part of the day is blocked
    if (this.selectedSlotType === 'HOURLY') {
      return !this.blockedDates.has(startDateKey);
    }
    
    // For daily/weekly/custom, check entire range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = this.getDateKey(currentDate);
      if (this.blockedDates.has(dateKey)) {
        return false;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return true;
  }

  /**
   * Get pricing multiplier based on booking type
   */
  getPricingInfo(): { multiplier: number; description: string } {
    switch (this.selectedSlotType) {
      case 'HOURLY':
        return { 
          multiplier: 1.0, 
          description: 'Standard hourly rate' 
        };
      case 'DAILY':
        return { 
          multiplier: 0.85, 
          description: '15% discount for daily bookings' 
        };
      case 'WEEKLY':
        return { 
          multiplier: 0.70, 
          description: '30% discount for weekly bookings' 
        };
      case 'CUSTOM':
        return { 
          multiplier: 0.90, 
          description: '10% discount for custom bookings' 
        };
      default:
        return { multiplier: 1.0, description: 'Standard rate' };
    }
  }

  /**
   * Get recommended duration based on slot type
   */
  getRecommendedDurations(): number[] {
    switch (this.selectedSlotType) {
      case 'HOURLY':
        return [1, 2, 3, 4, 6, 8, 12];
      case 'DAILY':
        return [24, 48, 72, 96, 120, 144, 168]; // 1-7 days
      case 'WEEKLY':
        return [168, 336, 504, 672]; // 1-4 weeks
      case 'CUSTOM':
        return [24, 72, 168, 336, 720]; // Mix of options
      default:
        return [24];
    }
  }

  /**
   * Get date key for date comparison
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onPreviousMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.generateCalendarDays();
  }

  onNextMonth(): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.generateCalendarDays();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelectedDate(date: Date): boolean {
    // A date is selected if it falls within the selected start and end date range
    return date >= this.selectedStartDate && date <= this.selectedEndDate;
  }

  isInSelectionRange(date: Date): boolean {
    if (!this.isSelectingRange || !this.tempStartDate) return false;
    return date >= this.tempStartDate && date <= this.selectedEndDate;
  }

  isDateDisabled(date: Date): boolean {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Check if date is blocked by existing reservations
    const dateKey = this.getDateKey(date);
    if (this.blockedDates.has(dateKey)) {
      return true;
    }

    // For hourly bookings, allow selection if at least some hours are available
    if (this.selectedSlotType === 'HOURLY') {
      return false; // Let the backend handle hourly availability
    }

    return false;
  }

  hasAvailableSlots(date: Date): boolean {
    // If no slots are loaded yet, assume the date is available
    // This prevents the calendar from being too restrictive initially
    if (this.availableSlots.length === 0) {
      return true;
    }

    // Check if any available slots exist for this date
    return this.availableSlots.some(slot => {
      if (!slot.available) return false;

      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      // A slot is relevant for a date if it overlaps with that date
      return slotStart < dateEnd && slotEnd > dateStart;
    });
  }

  getAvailableSlotsForDate(date: Date): SlotDto[] {
    return this.availableSlots.filter(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      // Return slots that span across the given date
      return date >= this.stripTime(slotStart) && date <= this.stripTime(slotEnd);
    });
  }

  getSlotCountForDate(date: Date): number {
    return this.getAvailableSlotsForDate(date).length;
  }

  // Helper methods for template
  getMonthName(): string {
    return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getDayNumber(date: Date): number {
    return date.getDate();
  }

  isSlotAvailable(slot: SlotDto): boolean {
    return slot.available;
  }

  getSlotDuration(slot: SlotDto): string {
    const start = new Date(slot.startTime as unknown as string);
    const end = new Date(slot.endTime as unknown as string);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours >= 24) {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}d`;
    }
    return `${diffHours}h`;
  }

  formatTime(date: Date): string {
    const d = new Date(date as unknown as string);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date as unknown as string);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric' // Added year for clarity in multi-day slots
    });
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  isDateInRange(date: Date): boolean {
    return date >= this.selectedStartDate && date <= this.selectedEndDate;
  }

  getDurationLabel(): string {
    if (this.selectedDuration < 24) {
      return `${this.selectedDuration} hour${this.selectedDuration > 1 ? 's' : ''}`;
    } else if (this.selectedDuration < 168) {
      const days = Math.ceil(this.selectedDuration / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else {
      const weeks = Math.ceil(this.selectedDuration / 168);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
  }

  getTotalPrice(): string {
    if (!this.vehicle || !this.selectedDuration) {
      return 'Calculating...';
    }

    // Get base price per day
    const basePricePerDay = this.vehicle.pricePerDay || 0;
    
    // Calculate total days (convert hours to days)
    const totalDays = Math.max(1, Math.ceil(this.selectedDuration / 24));
    
    // Get pricing multiplier based on booking type
    const pricingInfo = this.getPricingInfo();
    
    // Calculate total price
    const baseTotal = basePricePerDay * totalDays;
    const discountedTotal = baseTotal * pricingInfo.multiplier;
    
    // Format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(discountedTotal);
  }

  // Helper methods for template bindings
  getMinDuration(): number {
    const option = this.slotTypeOptions.find(opt => opt.value === this.selectedSlotType);
    return option?.minDuration || 1;
  }

  getMaxDuration(): number {
    const option = this.slotTypeOptions.find(opt => opt.value === this.selectedSlotType);
    return option?.maxDuration || 24;
  }

  // Helper method for duration percentage display
  getDurationPercentage(): number {
    const maxDuration = this.getMaxDuration();
    return Math.min((this.selectedDuration / maxDuration) * 100, 100);
  }

  // Manual duration adjustment
  adjustDuration(hours: number): void {
    if (hours < this.getMinDuration() || hours > this.getMaxDuration()) {
      return; // Invalid duration
    }

    this.selectedDuration = hours;
    this.updateEndDateBasedOnDuration();

    // Only load slots if we have a complete date range
    if (this.selectedStartDate && this.selectedEndDate && this.selectedStartDate !== this.selectedEndDate) {
      this.loadAvailableSlots();
    }
  }

  // Get duration options based on slot type
  getDurationOptions(): number[] {
    const option = this.slotTypeOptions.find(opt => opt.value === this.selectedSlotType);
    if (!option) return [24];

    const options: number[] = [];
    for (let i = option.minDuration; i <= option.maxDuration; i += option.minDuration) {
      options.push(i);
    }
    return options;
  }

  // Clear current selection
  clearSelection(): void {
    this.isSelectingRange = false;
    this.tempStartDate = null;
    this.selectedStartDate = new Date();
    this.selectedEndDate = new Date();
    this.selectedDuration = 24;
    this.availableSlots = [];
  }

  // Reset to default state
  resetToDefault(): void {
    this.clearSelection();
    this.initDateRange();
    this.updateDurationBasedOnSlotType();
  }

  protected readonly Math = Math;

  // Hourly booking methods
  getAvailableHours(): number[] {
    const hours = [];
    for (let i = 6; i <= 22; i++) { // 6 AM to 10 PM
      hours.push(i);
    }
    return hours;
  }

  getAvailableEndHours(): number[] {
    if (!this.selectedStartHour) return [];
    const hours = [];
    for (let i = this.selectedStartHour + 1; i <= 23; i++) { // End hour must be after start hour
      hours.push(i);
    }
    return hours;
  }

  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  getHourlyDuration(): number {
    if (!this.selectedStartHour || !this.selectedEndHour) return 0;
    return this.selectedEndHour - this.selectedStartHour;
  }

  updateHourlySelection(): void {
    if (this.selectedStartHour && this.selectedEndHour && this.selectedStartDate) {
      // Update the duration based on hour selection
      this.selectedDuration = this.getHourlyDuration();
      
      // Update the end date with the correct time
      const startDateTime = new Date(this.selectedStartDate);
      startDateTime.setHours(this.selectedStartHour, 0, 0, 0);
      
      const endDateTime = new Date(this.selectedStartDate);
      endDateTime.setHours(this.selectedEndHour, 0, 0, 0);
      
      this.selectedStartDate = startDateTime;
      this.selectedEndDate = endDateTime;
      
      // Reload slots with the new time range
      this.loadAvailableSlots();
    }
  }

  getHourRangeForDate(date: Date): string {
    if (this.selectedSlotType === 'HOURLY' && this.selectedStartHour !== undefined && this.selectedEndHour !== undefined) {
      return `${this.formatHour(this.selectedStartHour).replace(':00', '')} - ${this.formatHour(this.selectedEndHour).replace(':00', '')}`;
    }
    return '';
  }
}
