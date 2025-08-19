import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-date-time-picker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './date-time-picker.html',
  styleUrl: './date-time-picker.css'
})
export class DateTimePicker implements OnInit, OnDestroy {
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() disabled: boolean = false;
  
  @Output() dateTimeChange = new EventEmitter<{startDate: Date, endDate: Date}>();
  @Output() startDateChange = new EventEmitter<Date>();
  @Output() endDateChange = new EventEmitter<Date>();

  dateTimeForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.dateTimeForm = this.fb.group({
      startDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      endTime: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    if (this.startDate) {
      const startDateStr = this.formatDateForInput(this.startDate);
      const startTimeStr = this.formatTimeForInput(this.startDate);
      this.dateTimeForm.patchValue({
        startDate: startDateStr,
        startTime: startTimeStr
      });
    }

    if (this.endDate) {
      const endDateStr = this.formatDateForInput(this.endDate);
      const endTimeStr = this.formatTimeForInput(this.endDate);
      this.dateTimeForm.patchValue({
        endDate: endDateStr,
        endTime: endTimeStr
      });
    }

    // Set min/max dates
    if (this.minDate) {
      const minDateStr = this.formatDateForInput(this.minDate);
      this.dateTimeForm.get('startDate')?.addValidators(Validators.min(minDateStr as any));
      this.dateTimeForm.get('endDate')?.addValidators(Validators.min(minDateStr as any));
    }

    if (this.maxDate) {
      const maxDateStr = this.formatDateForInput(this.maxDate);
      this.dateTimeForm.get('startDate')?.addValidators(Validators.max(maxDateStr as any));
      this.dateTimeForm.get('endDate')?.addValidators(Validators.max(maxDateStr as any));
    }
  }

  private setupFormListeners(): void {
    this.dateTimeForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.dateTimeForm.valid) {
        this.onDateTimeChange();
      }
    });
  }

  private onDateTimeChange(): void {
    const startDate = this.dateTimeForm.get('startDate')?.value;
    const startTime = this.dateTimeForm.get('startTime')?.value;
    const endDate = this.dateTimeForm.get('endDate')?.value;
    const endTime = this.dateTimeForm.get('endTime')?.value;

    if (startDate && startTime && endDate && endTime) {
      const startDateTime = this.combineDateAndTime(startDate, startTime);
      const endDateTime = this.combineDateAndTime(endDate, endTime);

      if (startDateTime && endDateTime) {
        this.startDateChange.emit(startDateTime);
        this.endDateChange.emit(endDateTime);
        this.dateTimeChange.emit({
          startDate: startDateTime,
          endDate: endDateTime
        });
      }
    }
  }

  private combineDateAndTime(dateStr: string, timeStr: string): Date | null {
    try {
      const date = new Date(dateStr);
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error('Error combining date and time:', error);
      return null;
    }
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTimeForInput(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  onStartDateChange(event: any): void {
    const startDate = new Date(event.target.value);
    this.startDateChange.emit(startDate);
  }

  onEndDateChange(event: any): void {
    const endDate = new Date(event.target.value);
    this.endDateChange.emit(endDate);
  }

  onStartTimeChange(event: any): void {
    const startTime = event.target.value;
    this.dateTimeForm.patchValue({ startTime }, { emitEvent: false });
    this.onDateTimeChange();
  }

  onEndTimeChange(event: any): void {
    const endTime = event.target.value;
    this.dateTimeForm.patchValue({ endTime }, { emitEvent: false });
    this.onDateTimeChange();
  }

  setQuickTimeRange(hours: number): void {
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now.getTime() + hours * 60 * 60 * 1000);

    this.dateTimeForm.patchValue({
      startDate: this.formatDateForInput(startDate),
      startTime: this.formatTimeForInput(startDate),
      endDate: this.formatDateForInput(endDate),
      endTime: this.formatTimeForInput(endDate)
    }, { emitEvent: false });

    this.onDateTimeChange();
  }

  setToday(): void {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    this.dateTimeForm.patchValue({
      startDate: this.formatDateForInput(today),
      startTime: '09:00',
      endDate: this.formatDateForInput(tomorrow),
      endTime: '09:00'
    }, { emitEvent: false });

    this.onDateTimeChange();
  }

  setThisWeek(): void {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    this.dateTimeForm.patchValue({
      startDate: this.formatDateForInput(startOfWeek),
      startTime: '09:00',
      endDate: this.formatDateForInput(endOfWeek),
      endTime: '17:00'
    }, { emitEvent: false });

    this.onDateTimeChange();
  }

  clearSelection(): void {
    this.dateTimeForm.reset();
    this.startDateChange.emit(null as any);
    this.endDateChange.emit(null as any);
    this.dateTimeChange.emit({ startDate: null as any, endDate: null as any });
  }

  get isFormValid(): boolean {
    return this.dateTimeForm.valid;
  }

  get startDateError(): string | null {
    const control = this.dateTimeForm.get('startDate');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Start date is required';
      if (control.errors['min']) return 'Start date is too early';
      if (control.errors['max']) return 'Start date is too late';
    }
    return null;
  }

  get endDateError(): string | null {
    const control = this.dateTimeForm.get('endDate');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'End date is required';
      if (control.errors['min']) return 'End date is too early';
      if (control.errors['max']) return 'End date is too late';
    }
    return null;
  }
}
