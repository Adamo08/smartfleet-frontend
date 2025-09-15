import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { TimezoneService, TimeZoneInfo } from '../../../core/services/timezone.service';
import { RecurringBookingService, RecurringPattern } from '../../../core/services/recurring-booking.service';
import { AvailabilityService } from '../../../core/services/availability.service';
import { Observable } from 'rxjs';

export interface BookingType {
  value: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
  label: string;
  description: string;
  icon: string;
  color: string;
  minDuration: number; // in hours
  maxDuration: number; // in hours
}

export interface DateSelection {
  startDate: Date | null;
  endDate: Date | null;
  startTime?: Date | null;
  endTime?: Date | null;
  duration: number; // in hours
  bookingType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
}

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule
  ],
  templateUrl: './booking-calendar.component.html',
  styleUrl: './booking-calendar.component.css'
})
export class BookingCalendarComponent implements OnInit, OnChanges {
  @Input() selectedBookingType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM' = 'DAILY';
  @Input() availableSlots: any[] = [];
  @Input() isLoading: boolean = false;
  @Input() disabledDates: Date[] = [];
  @Input() vehicleId: number = 0;
  
  @Output() dateSelectionChange = new EventEmitter<DateSelection>();
  @Output() bookingTypeChange = new EventEmitter<'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM'>();

  // Date selection state
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  selectedStartTime: Date | null = null;
  selectedEndTime: Date | null = null;
  customDuration: number = 24; // in hours

  // Calendar state
  currentView: 'month' | 'week' | 'day' = 'month';
  minDate = new Date();
  maxDate = new Date();
  
  // Booking types configuration
  bookingTypes: BookingType[] = [
    {
      value: 'HOURLY',
      label: 'Hourly',
      description: 'Perfect for quick trips (1-23 hours)',
      icon: 'schedule',
      color: 'orange',
      minDuration: 1,
      maxDuration: 23
    },
    {
      value: 'DAILY',
      label: 'Daily',
      description: 'Great for day trips (1-7 days)',
      icon: 'today',
      color: 'blue',
      minDuration: 24,
      maxDuration: 168
    },
    {
      value: 'WEEKLY',
      label: 'Weekly',
      description: 'Best for extended trips (1-4 weeks)',
      icon: 'date_range',
      color: 'purple',
      minDuration: 168,
      maxDuration: 720
    },
    {
      value: 'CUSTOM',
      label: 'Custom',
      description: 'Flexible duration (any time range)',
      icon: 'tune',
      color: 'green',
      minDuration: 1,
      maxDuration: 8760
    }
  ];

  // Advanced features
  selectedTimeZone: string = 'UTC';
  timeZones: TimeZoneInfo[] = [];
  enableRecurring: boolean = false;
  recurringPattern: RecurringPattern | null = null;
  showAdvancedOptions: boolean = false;

  // Expose Math for template use
  readonly Math = Math;

  constructor(
    private timezoneService: TimezoneService,
    private recurringBookingService: RecurringBookingService,
    private availabilityService: AvailabilityService
  ) {}

  ngOnInit() {
    // Set max date to 1 year from now
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
    this.updateCalendarView();
    
    // Initialize time zones
    this.timeZones = this.timezoneService.getTimeZones();
    this.selectedTimeZone = this.timezoneService.getCurrentTimeZone();
    
    // Load disabled dates if vehicleId is provided
    if (this.vehicleId) {
      this.loadDisabledDates();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedBookingType']) {
      this.updateCalendarView();
      this.resetSelection();
    }
  }

  updateCalendarView() {
    switch (this.selectedBookingType) {
      case 'HOURLY':
        this.currentView = 'day';
        break;
      case 'DAILY':
        this.currentView = 'month';
        break;
      case 'WEEKLY':
        this.currentView = 'week';
        break;
      case 'CUSTOM':
        this.currentView = 'month';
        break;
    }
  }

  onBookingTypeChange(bookingType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM') {
    this.selectedBookingType = bookingType;
    this.updateCalendarView();
    this.resetSelection();
    this.bookingTypeChange.emit(bookingType);
  }

  onDateChange() {
    this.emitDateSelection();
  }

  onTimeChange() {
    if (this.selectedStartTime && this.selectedEndTime) {
      this.calculateDuration();
    }
    this.emitDateSelection();
  }

  onCustomDurationChange() {
    this.emitDateSelection();
  }

  calculateDuration() {
    if (this.selectedStartTime && this.selectedEndTime) {
      const diffMs = this.selectedEndTime.getTime() - this.selectedStartTime.getTime();
      this.customDuration = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60))); // Convert to hours
    }
  }

  resetSelection() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.selectedStartTime = null;
    this.selectedEndTime = null;
    this.customDuration = this.getDefaultDuration();
  }

  getDefaultDuration(): number {
    const bookingType = this.bookingTypes.find(bt => bt.value === this.selectedBookingType);
    return bookingType ? bookingType.minDuration : 24;
  }

  emitDateSelection() {
    const selection: DateSelection = {
      startDate: this.selectedStartDate,
      endDate: this.selectedEndDate,
      startTime: this.selectedStartTime,
      endTime: this.selectedEndTime,
      duration: this.customDuration,
      bookingType: this.selectedBookingType
    };
    this.dateSelectionChange.emit(selection);
  }

  getSelectedBookingType(): BookingType {
    return this.bookingTypes.find(bt => bt.value === this.selectedBookingType) || this.bookingTypes[1];
  }


  getDurationLabel(): string {
    if (this.customDuration < 24) {
      return `${this.customDuration} hours`;
    } else if (this.customDuration < 168) {
      return `${Math.round(this.customDuration / 24)} days`;
    } else {
      return `${Math.round(this.customDuration / 168)} weeks`;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getAvailableHours(): number[] {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  }

  getAvailableEndHours(): number[] {
    if (!this.selectedStartTime) return [];
    const startHour = this.selectedStartTime.getHours();
    const hours = [];
    for (let i = startHour + 1; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  }

  setTimeFromHour(hour: number, isStart: boolean) {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    
    if (isStart) {
      this.selectedStartTime = date;
    } else {
      this.selectedEndTime = date;
    }
    
    this.onTimeChange();
  }

  getQuickDurationOptions(): number[] {
    const bookingType = this.getSelectedBookingType();
    const options = [];
    
    if (this.selectedBookingType === 'HOURLY') {
      options.push(1, 2, 4, 8, 12, 24);
    } else if (this.selectedBookingType === 'DAILY') {
      options.push(24, 48, 72, 120, 168); // 1, 2, 3, 5, 7 days
    } else if (this.selectedBookingType === 'WEEKLY') {
      options.push(168, 336, 504, 672); // 1, 2, 3, 4 weeks
    } else {
      options.push(24, 48, 72, 168, 336, 504); // Mixed options
    }
    
    return options.filter(option => 
      option >= bookingType.minDuration && option <= bookingType.maxDuration
    );
  }

  selectQuickDuration(duration: number) {
    this.customDuration = duration;
    this.onCustomDurationChange();
  }

  // Advanced features methods

  onTimeZoneChange(timeZone: string) {
    this.selectedTimeZone = timeZone;
    this.timezoneService.setCurrentTimeZone(timeZone);
    this.emitDateSelection();
  }

  onRecurringToggle(enabled: boolean) {
    this.enableRecurring = enabled;
    if (enabled && !this.recurringPattern) {
      this.recurringPattern = {
        type: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5] // Weekdays
      };
    }
    this.emitDateSelection();
  }

  onRecurringPatternChange(pattern: RecurringPattern) {
    this.recurringPattern = pattern;
    this.emitDateSelection();
  }

  getRecurringSuggestions(): RecurringPattern[] {
    return this.recurringBookingService.getRecurringPatternSuggestions(this.selectedBookingType);
  }

  getRecurringSummary(): string {
    if (!this.recurringPattern || !this.selectedStartDate || !this.selectedEndDate) {
      return '';
    }

    const recurringBooking = {
      pattern: this.recurringPattern,
      startDate: this.selectedStartDate,
      endDate: this.selectedEndDate,
      duration: this.customDuration,
      bookingType: this.selectedBookingType
    };

    return this.recurringBookingService.getRecurringSummary(recurringBooking);
  }

  exportSchedule(): void {
    if (!this.recurringPattern || !this.selectedStartDate || !this.selectedEndDate) {
      return;
    }

    const recurringBooking = {
      pattern: this.recurringPattern,
      startDate: this.selectedStartDate,
      endDate: this.selectedEndDate,
      duration: this.customDuration,
      bookingType: this.selectedBookingType
    };

    const csvContent = this.recurringBookingService.exportRecurringSchedule(recurringBooking);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  isBusinessHour(date: Date): boolean {
    return this.timezoneService.isBusinessHour(date, this.selectedTimeZone);
  }

  getBusinessHours(): { start: number; end: number } {
    return this.timezoneService.getBusinessHours(this.selectedTimeZone);
  }

  formatDateInTimeZone(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return this.timezoneService.formatDateInTimeZone(date, this.selectedTimeZone, options);
  }

  getTimeZoneInfo(): TimeZoneInfo | undefined {
    return this.timezoneService.getTimeZoneInfo(this.selectedTimeZone);
  }

  // Availability checking methods
  private loadDisabledDates(): void {
    if (!this.vehicleId) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Load next 3 months

    this.availabilityService.getDisabledDates(this.vehicleId, startDate, endDate).subscribe({
      next: (dates) => {
        this.disabledDates = dates;
      },
      error: (error) => {
        console.error('Error loading disabled dates:', error);
      }
    });
  }

  isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Check if date is in disabled dates
    return this.disabledDates.some(disabledDate => 
      date.toDateString() === disabledDate.toDateString()
    );
  };

  isHourDisabled(hour: number): boolean {
    if (!this.selectedStartDate || this.selectedBookingType !== 'HOURLY') {
      return false;
    }

    // This would need to be implemented with real-time availability checking
    // For now, we'll use a simple business hours check
    const businessHours = this.getBusinessHours();
    return hour < businessHours.start || hour >= businessHours.end;
  }

  checkAvailabilityForDate(date: Date): Observable<boolean> {
    if (!this.vehicleId) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    return this.availabilityService.isDateTimeAvailable(
      this.vehicleId,
      date,
      this.selectedBookingType
    );
  }

  getAvailabilitySummary(): Observable<{
    totalDays: number;
    availableDays: number;
    unavailableDays: number;
    availabilityPercentage: number;
  }> {
    if (!this.vehicleId || !this.selectedStartDate || !this.selectedEndDate) {
      return new Observable(observer => {
        observer.next({
          totalDays: 0,
          availableDays: 0,
          unavailableDays: 0,
          availabilityPercentage: 0
        });
        observer.complete();
      });
    }

    return this.availabilityService.getAvailabilitySummary(
      this.vehicleId,
      this.selectedStartDate,
      this.selectedEndDate,
      this.selectedBookingType
    );
  }
}
