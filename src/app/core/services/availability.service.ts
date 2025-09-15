import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UnavailableSlot {
  startDate: string;
  endDate: string;
  reason: 'RESERVED' | 'MAINTENANCE' | 'UNAVAILABLE';
  slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
}

export interface AvailabilityCheck {
  isAvailable: boolean;
  unavailableSlots: UnavailableSlot[];
  availableSlots: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  /**
   * Get unavailable slots for a vehicle in a date range
   */
  getUnavailableSlots(
    vehicleId: number, 
    startDate: Date, 
    endDate: Date, 
    bookingType: string = 'DAILY'
  ): Observable<UnavailableSlot[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString())
      .set('bookingType', bookingType);

    return this.http.get<UnavailableSlot[]>(`${this.baseUrl}/vehicles/${vehicleId}/unavailable-slots`, { params });
  }

  /**
   * Check availability for specific dates
   */
  checkAvailability(
    vehicleId: number,
    dates: Date[],
    bookingType: string = 'DAILY'
  ): Observable<AvailabilityCheck> {
    const params = new HttpParams()
      .set('dates', dates.map(d => d.toISOString()).join(','))
      .set('bookingType', bookingType);

    return this.http.get<AvailabilityCheck>(`${this.baseUrl}/vehicles/${vehicleId}/availability-check`, { params });
  }

  /**
   * Get disabled dates for calendar (for daily/weekly bookings)
   */
  getDisabledDates(vehicleId: number, startDate: Date, endDate: Date): Observable<Date[]> {
    return this.getUnavailableSlots(vehicleId, startDate, endDate, 'DAILY').pipe(
      map(slots => {
        const disabledDates: Date[] = [];
        slots.forEach(slot => {
          if (slot.slotType === 'DAILY' || slot.slotType === 'WEEKLY') {
            const start = new Date(slot.startDate);
            const end = new Date(slot.endDate);
            
            // Add all dates in the range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              disabledDates.push(new Date(d));
            }
          }
        });
        return disabledDates;
      })
    );
  }

  /**
   * Get disabled hours for calendar (for hourly bookings)
   */
  getDisabledHours(vehicleId: number, date: Date): Observable<number[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getUnavailableSlots(vehicleId, startOfDay, endOfDay, 'HOURLY').pipe(
      map(slots => {
        const disabledHours: number[] = [];
        slots.forEach(slot => {
          if (slot.slotType === 'HOURLY') {
            const start = new Date(slot.startDate);
            const end = new Date(slot.endDate);
            
            // Add all hours in the range
            for (let h = start.getHours(); h < end.getHours(); h++) {
              disabledHours.push(h);
            }
          }
        });
        return [...new Set(disabledHours)]; // Remove duplicates
      })
    );
  }

  /**
   * Check if a specific date/time is available
   */
  isDateTimeAvailable(
    vehicleId: number,
    date: Date,
    bookingType: string = 'DAILY'
  ): Observable<boolean> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    if (bookingType === 'HOURLY') {
      endDate.setHours(date.getHours() + 1);
    } else {
      endDate.setDate(date.getDate() + 1);
    }

    return this.getUnavailableSlots(vehicleId, startDate, endDate, bookingType).pipe(
      map(slots => slots.length === 0)
    );
  }

  /**
   * Get availability summary for a date range
   */
  getAvailabilitySummary(
    vehicleId: number,
    startDate: Date,
    endDate: Date,
    bookingType: string = 'DAILY'
  ): Observable<{
    totalDays: number;
    availableDays: number;
    unavailableDays: number;
    availabilityPercentage: number;
  }> {
    return this.getUnavailableSlots(vehicleId, startDate, endDate, bookingType).pipe(
      map(slots => {
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const unavailableDays = slots.length;
        const availableDays = totalDays - unavailableDays;
        const availabilityPercentage = totalDays > 0 ? (availableDays / totalDays) * 100 : 0;

        return {
          totalDays,
          availableDays,
          unavailableDays,
          availabilityPercentage
        };
      })
    );
  }
}
