import { Component, Input } from '@angular/core';
import { DetailedReservationDto } from '../../../../core/models/reservation.interface';
import { ReservationStatus } from '../../../../core/enums/reservation-status.enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.css'
})
export class ReservationDetail {
  @Input() reservation!: DetailedReservationDto;

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

  getStatusText(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'Pending';
      case ReservationStatus.CONFIRMED:
        return 'Confirmed';
      case ReservationStatus.COMPLETED:
        return 'Completed';
      case ReservationStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}
