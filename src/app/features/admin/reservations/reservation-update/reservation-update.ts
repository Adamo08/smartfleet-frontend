import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DetailedReservationDto } from '../../../../core/models/reservation.interface';
import { ReservationStatus } from '../../../../core/enums/reservation-status.enum';
import { ReservationService } from '../../../../core/services/reservation.service';

@Component({
  selector: 'app-reservation-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-update.html',
  styleUrl: './reservation-update.css'
})
export class ReservationUpdate implements OnInit {
  @Input() reservation: DetailedReservationDto | null = null;
  @Output() reservationUpdated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  updateForm!: FormGroup;
  isSubmitting = false;
  
  readonly ReservationStatus = ReservationStatus;
  readonly statusOptions = [
    { value: ReservationStatus.PENDING, label: 'Pending', description: 'Awaiting confirmation' },
    { value: ReservationStatus.CONFIRMED, label: 'Confirmed', description: 'Reservation confirmed' },
    { value: ReservationStatus.COMPLETED, label: 'Completed', description: 'Reservation completed' },
    { value: ReservationStatus.CANCELLED, label: 'Cancelled', description: 'Reservation cancelled' }
  ];

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.updateForm = this.fb.group({
      status: [this.reservation?.status || '', [Validators.required]],
      comment: [this.reservation?.comment || ''],
      adminNotes: [''] // New field for admin notes
    });
  }

  onSubmit(): void {
    if (this.updateForm.invalid || this.isSubmitting || !this.reservation) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.updateForm.value;

    this.reservationService.updateReservationAdmin(this.reservation.id, {
      status: formData.status,
      comment: formData.comment,
      adminNotes: formData.adminNotes
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.reservationUpdated.emit();
      },
      error: (error) => {
        console.error('Error updating reservation:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case ReservationStatus.CONFIRMED:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case ReservationStatus.COMPLETED:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case ReservationStatus.CANCELLED:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  }

  isValidTransition(fromStatus: ReservationStatus, toStatus: ReservationStatus): boolean {
    // Define valid status transitions
    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
      [ReservationStatus.COMPLETED]: [], // Completed reservations cannot be changed
      [ReservationStatus.CANCELLED]: [ReservationStatus.PENDING] // Allow reactivation
    };

    return validTransitions[fromStatus]?.includes(toStatus) || fromStatus === toStatus;
  }

  getAvailableStatuses(): typeof this.statusOptions {
    if (!this.reservation) return this.statusOptions;
    
    return this.statusOptions.filter(option => 
      this.isValidTransition(this.reservation!.status, option.value)
    );
  }
}
