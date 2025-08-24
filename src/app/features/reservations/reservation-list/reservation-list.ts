import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth';
import { ReservationSummaryDto, ReservationFilter } from '../../../core/models/reservation.interface';
import { Pageable, Page } from '../../../core/models/pagination.interface';
import { ReservationStatus } from '../../../core/enums/reservation-status.enum';
import { Pagination } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Pagination],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit, OnDestroy {
  reservationsPage!: Page<ReservationSummaryDto>;
  loading: boolean = false;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  sortBy: string = 'createdAt';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  // Filtering
  filterForm: FormGroup;
  selectedStatus: ReservationStatus | '' = '';
  searchTerm: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      searchTerm: [''],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.setupFilterListener();
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 0;
        this.loadReservations();
      });
  }

  loadReservations(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    const filter: ReservationFilter = {
      status: this.filterForm.value.status || undefined,
      startDate: this.filterForm.value.startDate ? new Date(this.filterForm.value.startDate) : undefined,
      endDate: this.filterForm.value.endDate ? new Date(this.filterForm.value.endDate) : undefined,
      searchTerm: this.filterForm.value.searchTerm || undefined
    };

    // Use the filtered endpoint for better search capabilities
    this.reservationService.getUserReservationsWithFilter(filter, pageable).subscribe({
      next: (page) => {
        this.reservationsPage = page;
        this.currentPage = page.number;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.error = 'Failed to load reservations';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReservations();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0;
    this.loadReservations();
  }

  onCreateReservation(): void {
    this.router.navigate(['/reservations/create']);
  }

  getMaxPageElement(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.reservationsPage?.totalElements || 0);
  }

  onFilterReset(): void {
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadReservations();
  }

  onSort(property: string): void {
    if (this.sortBy === property) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = property;
      this.sortDirection = 'ASC';
    }
    this.currentPage = 0;
    this.loadReservations();
  }

  getSortIconClass(property: string): string {
    if (this.sortBy !== property) return 'text-gray-400';
    return this.sortDirection === 'ASC' ? 'text-blue-500' : 'text-blue-500';
  }

  getSortIcon(property: string): string {
    if (this.sortBy !== property) return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4';
    return this.sortDirection === 'ASC' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  }

  onReservationClick(reservation: ReservationSummaryDto): void {
    // Handle reservation click - could open a modal or navigate to detail page
    console.log('Reservation clicked:', reservation);
    // You can implement navigation or modal opening here
    // this.router.navigate(['/reservations', reservation.id]);
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalDays(startDate: Date | string, endDate: Date | string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusColor(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'bg-green-500';
      case ReservationStatus.PENDING:
        return 'bg-yellow-500';
      case ReservationStatus.CANCELLED:
        return 'bg-red-500';
      case ReservationStatus.COMPLETED:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusText(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'Confirmed';
      case ReservationStatus.PENDING:
        return 'Pending';
      case ReservationStatus.CANCELLED:
        return 'Cancelled';
      case ReservationStatus.COMPLETED:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }
}
