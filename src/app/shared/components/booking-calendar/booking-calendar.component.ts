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
  calendarMonth: Date = new Date();
  calendarDays: Date[] = [];
  isSelectingRange: boolean = false;
  tempStartDate: Date | null = null;
  // Multi-select support (weeks/days)
  selectedWeeks: Set<string> = new Set(); // keys: yyyy-ww
  selectedDiscreteDays: Set<string> = new Set(); // keys: yyyy-mm-dd

  // Availability cache (per month/day)
  private disabledDaysByMonth: Map<string, Set<string>> = new Map(); // key: yyyy-mm, values: set of yyyy-mm-dd
  private disabledHoursByDate: Map<string, Set<number>> = new Map(); // key: yyyy-mm-dd, values: hours
  
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

    // Initialize month grid
    this.calendarMonth = new Date();
    this.calendarMonth.setDate(1);
    this.generateCalendarDays();
    // Preload disabled dates for current month
    this.preloadDisabledForMonth(this.calendarMonth);
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
    // Reset auxiliary selections when type changes
    this.selectedWeeks.clear();
    this.selectedDiscreteDays.clear();
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

  // Month grid helpers for DAILY/CUSTOM views
  private generateCalendarDays(): void {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay(); // 0-6
    const lastDate = lastDay.getDate();

    const days: Date[] = [];

    // Leading days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const d = new Date(year, month, i - firstDayOfWeek + 1);
      days.push(d);
    }

    // Current month days
    for (let d = 1; d <= lastDate; d++) {
      days.push(new Date(year, month, d));
    }

    // Trailing days to fill 6 rows (42 cells)
    while (days.length % 7 !== 0 || days.length < 42) {
      const last = days[days.length - 1];
      days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
    }

    this.calendarDays = days;
  }

  prevMonth(): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1);
    this.generateCalendarDays();
    this.preloadDisabledForMonth(this.calendarMonth);
  }

  nextMonth(): void {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1);
    this.generateCalendarDays();
    this.preloadDisabledForMonth(this.calendarMonth);
  }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  isOutsideCurrentMonth(date: Date): boolean {
    return date.getMonth() !== this.calendarMonth.getMonth();
  }

  onDayClick(date: Date): void {
    if (this.isDateDisabled(date)) return;

    // Weekly snapping: select entire week at once
    if (this.selectedBookingType === 'WEEKLY') {
      const start = this.getStartOfWeek(date);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      this.selectedStartDate = start;
      this.selectedEndDate = end;
      // Toggle the week in selection set
      const weekKey = this.getWeekKey(start);
      if (this.selectedWeeks.has(weekKey)) {
        this.selectedWeeks.delete(weekKey);
      } else {
        this.selectedWeeks.add(weekKey);
      }
      this.isSelectingRange = false;
      this.tempStartDate = null;
      this.emitDateSelection();
      return;
    }

    if (!this.isSelectingRange) {
      this.isSelectingRange = true;
      this.tempStartDate = new Date(date);
      this.selectedStartDate = new Date(date);
      this.selectedEndDate = new Date(date);
    } else {
      // complete range
      if (this.tempStartDate) {
        if (date >= this.tempStartDate) {
          this.selectedStartDate = new Date(this.tempStartDate);
          this.selectedEndDate = new Date(date);
        } else {
          this.selectedStartDate = new Date(date);
          this.selectedEndDate = new Date(this.tempStartDate);
        }
      }
      this.isSelectingRange = false;
      this.tempStartDate = null;
      // Mark all discrete days in range as selected (visual aid for DAILY/CUSTOM)
      this.markDiscreteDaysInRange(this.selectedStartDate!, this.selectedEndDate!);
      // Emit selection after range is set
      this.emitDateSelection();
    }
  }

  isInSelectedRange(date: Date): boolean {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(this.selectedStartDate.getFullYear(), this.selectedStartDate.getMonth(), this.selectedStartDate.getDate());
    const e = new Date(this.selectedEndDate.getFullYear(), this.selectedEndDate.getMonth(), this.selectedEndDate.getDate());
    return d >= s && d <= e;
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0 = Sun
    const diff = d.getDate() - day; // start on Sunday
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }

  private getMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private getDateKeySimple(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getWeekKey(startOfWeek: Date): string {
    // yyyy-ww (ISO week approx based on Sunday start)
    const onejan = new Date(startOfWeek.getFullYear(), 0, 1);
    const days = Math.floor((startOfWeek.getTime() - onejan.getTime()) / 86400000);
    const week = Math.floor((days + onejan.getDay()) / 7);
    return `${startOfWeek.getFullYear()}-${String(week).padStart(2, '0')}`;
  }

  private markDiscreteDaysInRange(start: Date, end: Date): void {
    this.selectedDiscreteDays.clear();
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= endDay) {
      this.selectedDiscreteDays.add(this.getDateKeySimple(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }

  private preloadDisabledForMonth(monthDate: Date): void {
    if (!this.vehicleId) return;
    const key = this.getMonthKey(monthDate);
    if (this.disabledDaysByMonth.has(key)) return;

    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    // Expand range slightly to include edge overlaps
    const startRange = new Date(start);
    startRange.setDate(startRange.getDate() - 7);
    const endRange = new Date(end);
    endRange.setDate(endRange.getDate() + 7);

    this.availabilityService.getUnavailableSlots(this.vehicleId, startRange, endRange, 'DAILY').subscribe({
      next: (slots) => {
        const set = new Set<string>();
        slots.forEach(slot => {
          if (slot.slotType === 'DAILY' || slot.slotType === 'WEEKLY') {
            const s = new Date(slot.startTime);
            const e = new Date(slot.endTime);
            for (let d = new Date(s.getFullYear(), s.getMonth(), s.getDate()); d <= e; d.setDate(d.getDate() + 1)) {
              set.add(this.getDateKeySimple(d));
            }
          }
        });
        this.disabledDaysByMonth.set(key, set);
      },
      error: () => {
        this.disabledDaysByMonth.set(key, new Set());
      }
    });
  }

  private ensureHourlyDisabledForDate(date: Date): void {
    const dateKey = this.getDateKeySimple(date);
    if (this.disabledHoursByDate.has(dateKey) || !this.vehicleId) return;
    this.availabilityService.getDisabledHours(this.vehicleId, date).subscribe({
      next: (hours) => {
        this.disabledHoursByDate.set(dateKey, new Set(hours));
      },
      error: () => {
        this.disabledHoursByDate.set(dateKey, new Set());
      }
    });
  }

  getDisabledHoursForSelectedDay(): Set<number> {
    if (!this.selectedStartDate) return new Set();
    const key = this.getDateKeySimple(this.selectedStartDate);
    return this.disabledHoursByDate.get(key) || new Set();
  }

  isHourBlocked(hour: number): boolean {
    return this.getDisabledHoursForSelectedDay().has(hour);
  }

  // cache-aware date disabled check
  isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const monthKey = this.getMonthKey(this.calendarMonth);
    const set = this.disabledDaysByMonth.get(monthKey);
    if (set) {
      return set.has(this.getDateKeySimple(date));
    }
    return this.disabledDates.some(disabledDate => date.toDateString() === disabledDate.toDateString());
  };


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
