import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ReservationService } from '../../../../core/services/reservation.service';
import { Page, Pageable, Sort } from '../../../../core/models/pagination.interface';
import { ReservationSummaryDto, ReservationFilter, DetailedReservationDto } from '../../../../core/models/reservation.interface';
import { ReservationStatus } from '../../../../core/enums/reservation-status.enum';
import { Modal } from '../../../../shared/components/modal/modal';
import { ConfigrmDialog, DialogActionType } from '../../../../shared/components/configrm-dialog/configrm-dialog';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { ReservationDetail } from '../reservation-detail/reservation-detail';
import { ReservationUpdate } from '../reservation-update/reservation-update';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Modal, ConfigrmDialog, Pagination, ReservationDetail, ReservationUpdate],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit {
  reservationsPage!: Page<ReservationSummaryDto>;
  filterForm: FormGroup;
  isLoading = false;

  currentPage = 0;
  pageSize = 10;
  sortBy = 'id';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  selectedReservation: DetailedReservationDto | null = null;
  showReservationDetailModal = false;
  showEditReservationModal = false;
  showDeleteReservationModal = false;
  reservationToDelete: ReservationSummaryDto | null = null;
  reservationToEdit: any = null; // Will hold DetailedReservationDto

  readonly ReservationStatus = ReservationStatus;
  readonly DialogActionType = DialogActionType;

  constructor(private reservationService: ReservationService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      userId: [null],
      vehicleId: [null],
      status: [''],
      startDate: [null],
      endDate: [null],
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading = true;
    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filter: ReservationFilter = {
      userId: this.filterForm.value.userId || undefined,
      vehicleId: this.filterForm.value.vehicleId || undefined,
      status: this.filterForm.value.status || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      searchTerm: this.filterForm.value.searchTerm || undefined
    };

    this.reservationService.getAllReservations(filter, pageable).subscribe({
      next: (page) => {
        this.reservationsPage = page;
        this.currentPage = page.number;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching reservations:', err);
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReservations();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'ASC';
    }
    this.loadReservations();
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset to first page on filter change
    this.loadReservations();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadReservations();
  }

  viewReservation(reservation: ReservationSummaryDto): void {
    // Load detailed reservation data for viewing
    this.reservationService.getReservationByIdAdmin(reservation.id).subscribe({
      next: (detailedReservation) => {
        this.selectedReservation = detailedReservation;
        this.showReservationDetailModal = true;
      },
      error: (err) => console.error('Error loading reservation details:', err)
    });
  }

  closeReservationDetailModal(): void {
    this.showReservationDetailModal = false;
    this.selectedReservation = null;
  }

  openDeleteReservationModal(reservation: ReservationSummaryDto): void {
    this.reservationToDelete = reservation;
    this.showDeleteReservationModal = true;
  }

  confirmDeleteReservation(): void {
    if (this.reservationToDelete && this.reservationToDelete.id) {
      this.reservationService.deleteReservation(this.reservationToDelete.id).subscribe({
        next: () => {
          this.closeDeleteReservationModal();
          this.loadReservations();
        },
        error: (err) => console.error('Error deleting reservation:', err)
      });
    }
  }

  closeDeleteReservationModal(): void {
    this.showDeleteReservationModal = false;
    this.reservationToDelete = null;
  }

  editReservation(reservation: ReservationSummaryDto): void {
    // Load detailed reservation data for editing
    this.reservationService.getReservationByIdAdmin(reservation.id).subscribe({
      next: (detailedReservation) => {
        this.reservationToEdit = detailedReservation;
        this.showEditReservationModal = true;
      },
      error: (err) => console.error('Error loading reservation details:', err)
    });
  }

  onReservationUpdated(): void {
    this.closeEditReservationModal();
    this.loadReservations();
  }

  closeEditReservationModal(): void {
    this.showEditReservationModal = false;
    this.reservationToEdit = null;
  }
}
