import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { SlotService } from '../../../core/services/slot.service';
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
  @Input() showDatePicker: boolean = true;
  @Input() includeUnavailable: boolean = false;
  @Input() selectedSlotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM' = 'DAILY';

  @Output() dateRangeSelected = new EventEmitter<{
    startDate: Date,
    endDate: Date,
    hasSlots: boolean,
    slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM',
    duration: number // in hours
  }>();

  // Slot type selection
  slotTypeOptions: SlotTypeOption[] = [
    { value: 'HOURLY', label: 'Hourly', description: 'Rent by the hour (min 1h, max 23h)', minDuration: 1, maxDuration: 23 },
    { value: 'DAILY', label: 'Daily', description: 'Rent by the day (min 1 day, max 7 days)', minDuration: 24, maxDuration: 168 },
    { value: 'WEEKLY', label: 'Weekly', description: 'Rent by the week (min 7 days, max 30 days)', minDuration: 168, maxDuration: 720 },
    { value: 'CUSTOM', label: 'Custom', description: 'Custom duration (any time range)', minDuration: 1, maxDuration: 8760 } // max 1 year
  ];

  selectedDuration: number = 24; // Default to 1 day in hours

  availableSlots: SlotDto[] = [];
  isLoading = false;
  errorMessage = '';

  // Date range selection
  selectedStartDate: Date = new Date();
  selectedEndDate: Date = new Date();

  // Calendar navigation
  currentMonth = new Date();
  calendarDays: Date[] = [];

  // Multi-day selection state
  isSelectingRange = false;
  tempStartDate: Date | null = null;

  private destroy$ = new Subject<void>();

  constructor(private slotService: SlotService) {
    this.initDateRange();
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.updateDurationBasedOnSlotType();
    this.loadAvailableSlots();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedSlotType'] && !changes['selectedSlotType'].firstChange) {
      this.updateDurationBasedOnSlotType();
      this.updateEndDateBasedOnDuration();
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

  public loadAvailableSlots(): void {
    if (!this.vehicleId || !this.selectedStartDate || !this.selectedEndDate) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Use getAllSlotsInRange from service, which now returns dynamic slots
    this.slotService.getAllSlotsInRange(this.vehicleId, this.selectedStartDate, this.selectedEndDate)
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

      // Update duration based on selected range (add 1 day to include end date)
      const diffMs = this.selectedEndDate.getTime() - this.selectedStartDate.getTime();
      this.selectedDuration = Math.ceil(diffMs / (1000 * 60 * 60)) + 24; // Add 24 hours to include end date

      // Adjust slot type based on duration
      this.adjustSlotTypeBasedOnDuration();

      // Only load slots after range is complete
      this.loadAvailableSlots();
    }
  }

  private adjustSlotTypeBasedOnDuration(): void {
    if (this.selectedDuration <= 23) {
      this.selectedSlotType = 'HOURLY';
    } else if (this.selectedDuration <= 168) {
      this.selectedSlotType = 'DAILY';
    } else if (this.selectedDuration <= 720) {
      this.selectedSlotType = 'WEEKLY';
    } else {
      this.selectedSlotType = 'CUSTOM';
    }
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

    // For now, enable all future dates by default
    // The actual availability will be checked when a date range is selected
    // This prevents the calendar from being too restrictive initially
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
      const days = Math.round(this.selectedDuration / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else {
      const weeks = Math.round(this.selectedDuration / 168);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    }
  }

  getTotalPrice(): string {
    // This would typically come from the vehicle price and duration
    // For now, return a placeholder
    return 'Calculating...';
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
}
