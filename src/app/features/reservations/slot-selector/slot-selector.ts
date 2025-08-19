import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { SlotService } from '../../../core/services/slot.service';
import { SlotDto } from '../../../core/models/slot.interface';
import { Vehicle } from '../../../core/models/vehicle.interface';

@Component({
  selector: 'app-slot-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slot-selector.html',
  styleUrl: './slot-selector.css'
})
export class SlotSelector implements OnInit, OnDestroy {
  @Input() vehicleId: number = 0;
  @Input() selectedDate: Date = new Date();
  @Input() startTime?: string;
  @Input() endTime?: string;
  @Input() showTimeSlots: boolean = true;
  @Input() showDatePicker: boolean = true;
  
  @Output() slotSelected = new EventEmitter<SlotDto>();
  @Output() dateChanged = new EventEmitter<Date>();
  @Output() timeRangeChanged = new EventEmitter<{start: string, end: string}>();

  availableSlots: SlotDto[] = [];
  selectedSlot: SlotDto | null = null;
  isLoading = false;
  errorMessage = '';
  
  // Date navigation
  currentMonth = new Date();
  calendarDays: Date[] = [];
  
  // Time slots
  timeSlots: string[] = [];
  selectedStartTime = '';
  selectedEndTime = '';

  private destroy$ = new Subject<void>();

  constructor(private slotService: SlotService) {
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.loadAvailableSlots();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateTimeSlots(): void {
    // Generate time slots from 6 AM to 10 PM in 1-hour intervals
    for (let hour = 6; hour <= 22; hour++) {
      this.timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
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

  private loadAvailableSlots(): void {
    if (!this.vehicleId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.slotService.getAvailableSlotsByVehicle(this.vehicleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load available slots';
          console.error('Error loading slots:', error);
        }
      });
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    this.dateChanged.emit(date);
    this.loadAvailableSlots();
  }

  onTimeSelect(startTime: string, endTime: string): void {
    this.selectedStartTime = startTime;
    this.selectedEndTime = endTime;
    this.timeRangeChanged.emit({ start: startTime, end: endTime });
  }

  onSlotSelect(slot: SlotDto): void {
    this.selectedSlot = slot;
    this.slotSelected.emit(slot);
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
    return date.toDateString() === this.selectedDate.toDateString();
  }

  hasAvailableSlots(date: Date): boolean {
    return this.availableSlots.some(slot => 
      slot.startTime.toDateString() === date.toDateString()
    );
  }

  getAvailableSlotsForDate(date: Date): SlotDto[] {
    return this.availableSlots.filter(slot => 
      slot.startTime.toDateString() === date.toDateString()
    );
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
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return `${diffHours}h`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
