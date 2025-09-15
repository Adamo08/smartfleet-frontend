import { Injectable } from '@angular/core';

export interface TimeZoneInfo {
  name: string;
  offset: string;
  displayName: string;
  city: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private readonly timeZones: TimeZoneInfo[] = [
    { name: 'Africa/Casablanca', offset: '+01:00', displayName: 'WAT', city: 'Casablanca' },
    { name: 'Africa/Rabat', offset: '+01:00', displayName: 'WAT', city: 'Rabat' },
    { name: 'Africa/Marrakech', offset: '+01:00', displayName: 'WAT', city: 'Marrakech' },
    { name: 'Africa/Agadir', offset: '+01:00', displayName: 'WAT', city: 'Agadir' },
    { name: 'Africa/Tangier', offset: '+01:00', displayName: 'WAT', city: 'Tangier' },
    { name: 'Europe/London', offset: '+00:00', displayName: 'GMT', city: 'London' },
    { name: 'Europe/Paris', offset: '+01:00', displayName: 'CET', city: 'Paris' },
    { name: 'Europe/Madrid', offset: '+01:00', displayName: 'CET', city: 'Madrid' },
    { name: 'UTC', offset: '+00:00', displayName: 'UTC', city: 'UTC' },
    { name: 'America/New_York', offset: '-05:00', displayName: 'EST', city: 'New York' }
  ];

  private currentTimeZone: string = 'Africa/Casablanca'; // Default to Morocco

  getTimeZones(): TimeZoneInfo[] {
    return this.timeZones;
  }

  getCurrentTimeZone(): string {
    return this.currentTimeZone;
  }

  setCurrentTimeZone(timeZone: string): void {
    this.currentTimeZone = timeZone;
  }

  getTimeZoneInfo(timeZone: string): TimeZoneInfo | undefined {
    return this.timeZones.find(tz => tz.name === timeZone);
  }

  convertToTimeZone(date: Date, timeZone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone }));
  }

  formatDateInTimeZone(date: Date, timeZone: string, options?: Intl.DateTimeFormatOptions): string {
    return date.toLocaleString('en-US', { 
      timeZone, 
      ...options 
    });
  }

  getTimeZoneOffset(timeZone: string): number {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone }));
    return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
  }

  isDST(date: Date, timeZone: string): boolean {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    
    const janOffset = this.getTimeZoneOffset(timeZone);
    const julOffset = this.getTimeZoneOffset(timeZone);
    
    return Math.max(janOffset, julOffset) !== Math.min(janOffset, julOffset);
  }

  getBusinessHours(timeZone: string): { start: number; end: number } {
    // Default business hours (9 AM to 5 PM)
    return { start: 9, end: 17 };
  }

  isBusinessHour(date: Date, timeZone: string): boolean {
    const businessHours = this.getBusinessHours(timeZone);
    const hour = this.convertToTimeZone(date, timeZone).getHours();
    return hour >= businessHours.start && hour < businessHours.end;
  }

  getNextBusinessDay(date: Date, timeZone: string): Date {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  getWorkingDaysBetween(startDate: Date, endDate: Date, timeZone: string): number {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }
}
