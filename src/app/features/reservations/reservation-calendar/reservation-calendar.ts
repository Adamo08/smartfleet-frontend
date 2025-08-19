import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ReservationService } from '../../../core/services/reservation.service';
import { SlotService } from '../../../core/services/slot.service';
import { ReservationSummaryDto } from '../../../core/models/reservation.interface';
import { SlotDto } from '../../../core/models/slot.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';

@Component({
  selector: 'app-reservation-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-calendar.html',
  styleUrl: './reservation-calendar.css'
})
export class ReservationCalendar implements OnInit, OnDestroy {
  @Input() userId?: number;
  @Input() vehicleId?: number;
  @Input() showReservations: boolean = true;
  @Input() showSlots: boolean = true;
  
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() reservationSelected = new EventEmitter<ReservationSummaryDto>();
  @Output() slotSelected = new EventEmitter<SlotDto>();

  currentDate: Date = new Date();
  selectedDate: Date = new Date();
  calendarDays: Date[] = [];
  reservations: ReservationSummaryDto[] = [];
  availableSlots: SlotDto[] = [];
  loading: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private slotService: SlotService
  ) {}

  ngOnInit(): void {
    this.generateCalendarDays();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    this.calendarDays = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      this.calendarDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  private loadData(): void {
    this.loading = true;
    
    if (this.showReservations) {
      this.loadReservations();
    }
    
    if (this.showSlots && this.vehicleId) {
      this.loadAvailableSlots();
    }
    
    this.loading = false;
  }

  private loadReservations(): void {
    if (this.userId) {
      this.reservationService.getReservationsForCurrentUser({ page: 0, size: 100 }).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (page) => {
          this.reservations = page.content;
        },
        error: (error) => {
          console.error('Error loading reservations:', error);
        }
      });
    }
  }

  private loadAvailableSlots(): void {
    if (this.vehicleId) {
      this.slotService.getAvailableSlotsByVehicle(this.vehicleId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
        },
        error: (error) => {
          console.error('Error loading available slots:', error);
        }
      });
    }
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    this.dateSelected.emit(date);
  }

  onReservationSelect(reservation: ReservationSummaryDto): void {
    this.reservationSelected.emit(reservation);
  }

  onSlotSelect(slot: SlotDto): void {
    this.slotSelected.emit(slot);
  }

  onPreviousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
    this.loadData();
  }

  onNextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
    this.loadData();
  }

  onToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.generateCalendarDays();
    this.loadData();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelected(date: Date): boolean {
    return this.selectedDate.toDateString() === date.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  hasReservations(date: Date): boolean {
    return this.reservations.some(reservation => {
      const reservationDate = new Date(reservation.startDate);
      return reservationDate.toDateString() === date.toDateString();
    });
  }

  hasAvailableSlots(date: Date): boolean {
    return this.availableSlots.some(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.toDateString() === date.toDateString();
    });
  }

  getReservationsForDate(date: Date): ReservationSummaryDto[] {
    return this.reservations.filter(reservation => {
      const reservationDate = new Date(reservation.startDate);
      return reservationDate.toDateString() === date.toDateString();
    });
  }

  getAvailableSlotsForDate(date: Date): SlotDto[] {
    return this.availableSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.toDateString() === date.toDateString();
    });
  }

  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'bg-yellow-500';
      case ReservationStatus.CONFIRMED:
        return 'bg-green-500';
      case ReservationStatus.CANCELLED:
        return 'bg-red-500';
      case ReservationStatus.COMPLETED:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'Pending';
      case ReservationStatus.CONFIRMED:
        return 'Confirmed';
      case ReservationStatus.CANCELLED:
        return 'Cancelled';
      case ReservationStatus.COMPLETED:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  }

  formatDay(date: Date): string {
    return date.getDate().toString();
  }

  formatDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getMonthName(): string {
    return this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  getDayClasses(date: Date): string {
    let classes = 'relative p-3 min-h-[80px] cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/20';
    
    if (this.isSelected(date)) {
      classes += ' bg-indigo-500/20 border-indigo-400/50';
    }
    
    if (!this.isCurrentMonth(date)) {
      classes += ' opacity-50';
    }
    
    return classes;
  }

  getDayNumberClasses(date: Date): string {
    let classes = 'text-sm font-medium mb-2';
    
    if (this.isToday(date)) {
      classes += ' text-indigo-400 font-bold';
    } else if (this.isSelected(date)) {
      classes += ' text-white';
    } else if (this.isCurrentMonth(date)) {
      classes += ' text-white';
    } else {
      classes += ' text-gray-500';
    }
    
    return classes;
  }
}
