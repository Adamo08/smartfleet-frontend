import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ReservationService } from '../../../../core/services/reservation.service';
import { Page, Pageable } from '../../../../core/models/pagination.interface';
import { ReservationSummaryDto, ReservationFilter } from '../../../../core/models/reservation.interface';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit {
  reservations: ReservationSummaryDto[] = [];
  filterForm: FormGroup;
  page = 0;
  size = 10;
  totalElements = 0;
  isLoading = false;

  constructor(private reservationService: ReservationService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      userId: [''],
      vehicleId: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(page: number = this.page): void {
    this.isLoading = true;
    const pageable: Pageable = { page, size: this.size } as Pageable;
    const filter: ReservationFilter = {
      userId: this.filterForm.value.userId || undefined,
      vehicleId: this.filterForm.value.vehicleId || undefined,
      status: this.filterForm.value.status || undefined
    } as ReservationFilter;
    this.reservationService.getAllReservations(filter, pageable).subscribe({
      next: (res: Page<ReservationSummaryDto>) => {
        this.reservations = res.content;
        this.totalElements = res.totalElements;
        this.page = res.number;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
