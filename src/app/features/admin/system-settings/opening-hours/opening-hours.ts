import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api';

interface DaySchedule {
  id?: number;
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  is24Hour: boolean;
  notes?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-opening-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opening-hours.html',
  styleUrl: './opening-hours.css'
})
export class OpeningHours implements OnInit {
  
  weekSchedule: DaySchedule[] = [
    { dayOfWeek: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', is24Hour: false, isActive: true },
    { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', is24Hour: false, isActive: true },
    { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', is24Hour: false, isActive: true },
    { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', is24Hour: false, isActive: true },
    { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '09:00', closeTime: '17:00', is24Hour: false, isActive: true },
    { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '10:00', closeTime: '16:00', is24Hour: false, isActive: true },
    { dayOfWeek: 'SUNDAY', isOpen: false, openTime: '00:00', closeTime: '00:00', is24Hour: false, isActive: true }
  ];

  isLoading = false;
  isSaving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadOpeningHours();
  }

  loadOpeningHours(): void {
    this.isLoading = true;
    this.apiService.get<DaySchedule[]>('/admin/settings/opening-hours').subscribe({
      next: (hours) => {
        if (hours && hours.length > 0) {
          this.weekSchedule = hours;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading opening hours:', error);
        this.isLoading = false;
        // Keep default schedule if loading fails
      }
    });
  }

  toggleDayOpen(day: DaySchedule): void {
    day.isOpen = !day.isOpen;
    if (!day.isOpen) {
      day.openTime = '00:00';
      day.closeTime = '00:00';
      day.is24Hour = false;
    }
  }

  toggle24Hour(day: DaySchedule): void {
    day.is24Hour = !day.is24Hour;
    if (day.is24Hour) {
      day.openTime = '00:00';
      day.closeTime = '23:59';
    }
  }

  saveOpeningHours(): void {
    this.isSaving = true;
    this.message = '';

    // Filter only active schedules
    const activeSchedules = this.weekSchedule.filter(day => day.isActive);

    // Save each schedule
    const savePromises = activeSchedules.map(schedule => {
      if (schedule.id) {
        // Update existing
        return this.apiService.put<DaySchedule>(`/admin/settings/opening-hours/${schedule.id}`, schedule).toPromise();
      } else {
        // Create new
        return this.apiService.post<DaySchedule>('/admin/settings/opening-hours', schedule).toPromise();
      }
    });

    Promise.all(savePromises)
      .then(() => {
        this.message = 'Opening hours saved successfully!';
        this.messageType = 'success';
        this.loadOpeningHours(); // Reload to get updated IDs
      })
      .catch((error) => {
        console.error('Error saving opening hours:', error);
        this.message = 'Error saving opening hours. Please try again.';
        this.messageType = 'error';
      })
      .finally(() => {
        this.isSaving = false;
      });
  }

  initializeDefaults(): void {
    this.isSaving = true;
    this.message = '';

    this.apiService.post('/admin/settings/opening-hours/initialize', {}).subscribe({
      next: () => {
        this.message = 'Default opening hours initialized successfully!';
        this.messageType = 'success';
        this.loadOpeningHours();
      },
      error: (error) => {
        console.error('Error initializing defaults:', error);
        this.message = 'Error initializing defaults. Please try again.';
        this.messageType = 'error';
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  clearMessage(): void {
    this.message = '';
  }
}
