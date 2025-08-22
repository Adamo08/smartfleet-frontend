import { Component, Input } from '@angular/core';
import { ReservationSummaryDto } from '../../../../core/models/reservation.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.css'
})
export class ReservationDetail {
  @Input() reservation!: ReservationSummaryDto;
}
