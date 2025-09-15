import { Injectable } from '@angular/core';

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number; // For monthly patterns
  endDate?: Date;
  occurrences?: number; // Maximum number of occurrences
}

export interface RecurringBooking {
  pattern: RecurringPattern;
  startDate: Date;
  endDate: Date;
  duration: number; // in hours
  bookingType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM';
}

@Injectable({
  providedIn: 'root'
})
export class RecurringBookingService {

  generateRecurringDates(recurringBooking: RecurringBooking): Date[] {
    const dates: Date[] = [];
    const { pattern, startDate, endDate } = recurringBooking;
    
    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    
    while (currentDate <= endDate && 
           (!pattern.occurrences || occurrenceCount < pattern.occurrences) &&
           (!pattern.endDate || currentDate <= pattern.endDate)) {
      
      dates.push(new Date(currentDate));
      occurrenceCount++;
      
      currentDate = this.getNextOccurrence(currentDate, pattern);
    }
    
    return dates;
  }

  private getNextOccurrence(currentDate: Date, pattern: RecurringPattern): Date {
    const nextDate = new Date(currentDate);
    
    switch (pattern.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
        
      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Find next occurrence of specified days
          nextDate.setDate(nextDate.getDate() + 1);
          while (!pattern.daysOfWeek.includes(nextDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
        } else {
          nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
        }
        break;
        
      case 'monthly':
        if (pattern.dayOfMonth) {
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
          nextDate.setDate(pattern.dayOfMonth);
        } else {
          nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        }
        break;
        
      case 'custom':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
    }
    
    return nextDate;
  }

  validateRecurringPattern(pattern: RecurringPattern): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (pattern.interval < 1) {
      errors.push('Interval must be at least 1');
    }
    
    if (pattern.type === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length === 0) {
      errors.push('Weekly pattern must specify at least one day of the week');
    }
    
    if (pattern.type === 'monthly' && pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
      errors.push('Day of month must be between 1 and 31');
    }
    
    if (pattern.occurrences && pattern.occurrences < 1) {
      errors.push('Number of occurrences must be at least 1');
    }
    
    if (pattern.endDate && pattern.occurrences) {
      errors.push('Cannot specify both end date and number of occurrences');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  getRecurringPatternSuggestions(bookingType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM'): RecurringPattern[] {
    const suggestions: RecurringPattern[] = [];
    
    switch (bookingType) {
      case 'HOURLY':
        suggestions.push(
          { type: 'daily', interval: 1 },
          { type: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] }, // Weekdays
          { type: 'weekly', interval: 1, daysOfWeek: [0, 6] } // Weekends
        );
        break;
        
      case 'DAILY':
        suggestions.push(
          { type: 'daily', interval: 1 },
          { type: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] }, // Weekdays
          { type: 'weekly', interval: 1, daysOfWeek: [0, 6] }, // Weekends
          { type: 'monthly', interval: 1 }
        );
        break;
        
      case 'WEEKLY':
        suggestions.push(
          { type: 'weekly', interval: 1 },
          { type: 'weekly', interval: 2 }, // Every 2 weeks
          { type: 'monthly', interval: 1 }
        );
        break;
        
      case 'CUSTOM':
        suggestions.push(
          { type: 'daily', interval: 1 },
          { type: 'weekly', interval: 1 },
          { type: 'monthly', interval: 1 },
          { type: 'custom', interval: 7 } // Every week
        );
        break;
    }
    
    return suggestions;
  }

  calculateRecurringPrice(basePrice: number, recurringBooking: RecurringBooking): number {
    const dates = this.generateRecurringDates(recurringBooking);
    const totalDays = dates.length;
    
    // Apply discounts for recurring bookings
    let discountMultiplier = 1.0;
    
    if (totalDays >= 30) {
      discountMultiplier = 0.85; // 15% discount for monthly recurring
    } else if (totalDays >= 14) {
      discountMultiplier = 0.90; // 10% discount for bi-weekly recurring
    } else if (totalDays >= 7) {
      discountMultiplier = 0.95; // 5% discount for weekly recurring
    }
    
    return basePrice * totalDays * discountMultiplier;
  }

  getRecurringSummary(recurringBooking: RecurringBooking): string {
    const dates = this.generateRecurringDates(recurringBooking);
    const totalOccurrences = dates.length;
    
    if (totalOccurrences === 0) {
      return 'No recurring dates generated';
    }
    
    const firstDate = dates[0].toLocaleDateString();
    const lastDate = dates[dates.length - 1].toLocaleDateString();
    
    return `${totalOccurrences} occurrences from ${firstDate} to ${lastDate}`;
  }

  exportRecurringSchedule(recurringBooking: RecurringBooking): string {
    const dates = this.generateRecurringDates(recurringBooking);
    const csvContent = [
      'Date,Start Time,End Time,Duration (hours),Booking Type',
      ...dates.map(date => {
        const startTime = date.toLocaleTimeString();
        const endTime = new Date(date.getTime() + (recurringBooking.duration * 60 * 60 * 1000)).toLocaleTimeString();
        return `${date.toLocaleDateString()},${startTime},${endTime},${recurringBooking.duration},${recurringBooking.bookingType}`;
      })
    ].join('\n');
    
    return csvContent;
  }
}
